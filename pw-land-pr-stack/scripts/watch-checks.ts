import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

export interface ExpectedCheck {
  name: string;
  workflow?: string;
  allowSkipped?: boolean;
}

export interface Target {
  repo: string;
  number: number;
  headSha: string;
  baseSha: string;
  baseBranch: string;
  expectedChecks: ExpectedCheck[];
}

export interface Check {
  name: string;
  workflow: string;
  state: string;
  bucket: string;
  link: string;
}

interface Manifest {
  targets: Target[];
  intervalSeconds: number;
  timeoutMinutes: number;
}

const execute = promisify(execFile);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string");
}

function isExpectedCheck(value: unknown): value is ExpectedCheck {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    (value.workflow === undefined || typeof value.workflow === "string") &&
    (value.allowSkipped === undefined ||
      typeof value.allowSkipped === "boolean")
  );
}

function isTarget(value: unknown): value is Target {
  return (
    isRecord(value) &&
    typeof value.repo === "string" &&
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.repo) &&
    typeof value.number === "number" &&
    Number.isSafeInteger(value.number) &&
    value.number > 0 &&
    typeof value.headSha === "string" &&
    /^[a-f0-9]{40}$/.test(value.headSha) &&
    typeof value.baseSha === "string" &&
    /^[a-f0-9]{40}$/.test(value.baseSha) &&
    typeof value.baseBranch === "string" &&
    value.baseBranch.length > 0 &&
    Array.isArray(value.expectedChecks) &&
    value.expectedChecks.length > 0 &&
    value.expectedChecks.every(isExpectedCheck)
  );
}

function positiveNumber(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("Polling interval and timeout must be positive numbers.");
  }
  return value;
}

export function parseManifest(value: unknown): Manifest {
  if (
    !isRecord(value) ||
    !Array.isArray(value.targets) ||
    value.targets.length === 0 ||
    !value.targets.every(isTarget)
  ) {
    throw new Error(
      "Expected targets with owner/repo, PR number, full head/base SHAs, baseBranch, and nonempty expectedChecks.",
    );
  }
  const identities = value.targets.map(
    (target) => `${target.repo.toLowerCase()}#${target.number}`,
  );
  if (new Set(identities).size !== identities.length)
    throw new Error("Duplicate PR targets.");
  return {
    targets: value.targets,
    intervalSeconds: positiveNumber(value.intervalSeconds, 30),
    timeoutMinutes: positiveNumber(value.timeoutMinutes, 60),
  };
}

async function ghJson(args: string[]): Promise<unknown> {
  try {
    const { stdout } = await execute("gh", args, {
      timeout: 45_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (
      isRecord(error) &&
      (error.code === 1 || error.code === 8) &&
      args[0] === "pr" &&
      args[1] === "checks"
    ) {
      if (typeof error.stdout === "string" && error.stdout.trim())
        return JSON.parse(error.stdout);
      if (
        typeof error.stderr === "string" &&
        /no checks reported/i.test(error.stderr)
      )
        return [];
    }
    throw error;
  }
}

function parseChecks(value: unknown): Check[] {
  if (
    !Array.isArray(value) ||
    !value.every((item): item is Check =>
      hasStrings(item, ["name", "workflow", "state", "bucket", "link"]),
    )
  ) {
    throw new Error(
      "Unexpected gh pr checks JSON; refusing to assume success.",
    );
  }
  return value;
}

function matches(check: Check, expected: ExpectedCheck): boolean {
  return (
    check.name === expected.name &&
    (expected.workflow === undefined || expected.workflow === check.workflow)
  );
}

export function assessChecks(expected: ExpectedCheck[], checks: Check[]) {
  const missing = expected.filter(
    (item) => !checks.some((check) => matches(check, item)),
  );
  const pending = checks.filter((check) => check.bucket === "pending");
  const concerns = checks.filter((check) => {
    if (check.bucket === "pending") return false;
    if (check.bucket === "pass" && check.state.toUpperCase() === "SUCCESS")
      return false;
    const skipped =
      check.bucket === "skipping" || check.state.toUpperCase() === "NEUTRAL";
    return (
      !skipped ||
      !expected.some((item) => item.allowSkipped && matches(check, item))
    );
  });
  const state =
    pending.length || missing.length
      ? "pending"
      : concerns.length
        ? "attention"
        : "settled";
  return {
    state,
    count: checks.length,
    pending: pending.map(({ name, workflow }) => ({ name, workflow })),
    missing,
    concerns,
    skipped: checks.filter(
      (check) =>
        check.bucket === "skipping" || check.state.toUpperCase() === "NEUTRAL",
    ),
  };
}

export async function inspectTarget(target: Target, query = ghJson) {
  const args = [
    "pr",
    "view",
    String(target.number),
    "--repo",
    target.repo,
    "--json",
    "headRefOid,baseRefOid,baseRefName,state,mergeable",
  ];
  const before = await query(args);
  const identity = {
    repo: target.repo,
    number: target.number,
    headSha: target.headSha,
    baseSha: target.baseSha,
  };
  function unavailable(value: unknown) {
    if (
      !hasStrings(value, [
        "headRefOid",
        "baseRefOid",
        "baseRefName",
        "state",
        "mergeable",
      ])
    ) {
      throw new Error(
        "Unexpected gh pr view JSON; refusing to assume unchanged refs.",
      );
    }
    if (
      value.headRefOid !== target.headSha ||
      value.baseRefOid !== target.baseSha ||
      value.baseRefName !== target.baseBranch ||
      value.state !== "OPEN"
    )
      return "changed";
    if (value.mergeable === "CONFLICTING") return "blocked";
    if (value.mergeable !== "MERGEABLE") return "pending";
    return null;
  }
  const beforeState = unavailable(before);
  if (beforeState) return { ...identity, state: beforeState, observed: before };
  const checks = parseChecks(
    await query([
      "pr",
      "checks",
      String(target.number),
      "--repo",
      target.repo,
      "--json",
      "name,workflow,state,bucket,link",
    ]),
  );
  const after = await query(args);
  const afterState = unavailable(after);
  if (afterState) return { ...identity, state: afterState, observed: after };
  return { ...identity, ...assessChecks(target.expectedChecks, checks) };
}

export async function watchTargets(
  manifest: Manifest,
  once: boolean,
  inspect = inspectTarget,
  pause: (milliseconds: number) => Promise<unknown> = setTimeout,
  now = Date.now,
) {
  const deadline = now() + manifest.timeoutMinutes * 60_000;
  while (true) {
    const results = await Promise.all(
      manifest.targets.map((target) => inspect(target)),
    );
    if (results.some((result) => result.state === "changed"))
      return { exitCode: 2, event: "changed", results };
    if (results.some((result) => result.state === "blocked"))
      return { exitCode: 5, event: "blocked", results };
    if (results.every((result) => result.state !== "pending")) {
      const failed = results.some((result) => result.state === "attention");
      return {
        exitCode: failed ? 1 : 0,
        event: failed ? "attention" : "settled",
        results,
      };
    }
    if (once) return { exitCode: 8, event: "pending", results };
    const remaining = deadline - now();
    if (remaining <= 0) return { exitCode: 4, event: "timeout", results };
    await pause(Math.min(manifest.intervalSeconds * 1000, remaining));
  }
}

async function main() {
  const [manifestPath, option, ...extra] = process.argv.slice(2);
  if (
    !manifestPath ||
    (option !== undefined && option !== "--once") ||
    extra.length
  ) {
    throw new Error("Usage: node watch-checks.ts MANIFEST.json [--once]");
  }
  const manifest = parseManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  process.stdout.write(
    JSON.stringify({
      event: "started",
      targets: manifest.targets.map(({ repo, number }) => ({ repo, number })),
    }) + "\n",
  );
  const result = await watchTargets(manifest, option === "--once");
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exitCode = result.exitCode;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      JSON.stringify({
        event: "error",
        message: error instanceof Error ? error.message : String(error),
      }) + "\n",
    );
    process.exitCode = 3;
  });
}
