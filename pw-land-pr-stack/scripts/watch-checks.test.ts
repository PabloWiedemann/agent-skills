import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessChecks,
  inspectTarget,
  parseManifest,
  watchTargets,
} from "./watch-checks.ts";
import type { Check, Target } from "./watch-checks.ts";

const target: Target = {
  repo: "example/project",
  number: 12,
  headSha: "a".repeat(40),
  baseSha: "b".repeat(40),
  baseBranch: "main",
  expectedChecks: [{ name: "unit", workflow: "CI" }],
};

function check(overrides: Partial<Check> = {}): Check {
  return {
    name: "unit",
    workflow: "CI",
    state: "SUCCESS",
    bucket: "pass",
    link: "https://example.com/check",
    ...overrides,
  };
}

function view(overrides: Record<string, unknown> = {}) {
  return {
    headRefOid: target.headSha,
    baseRefOid: target.baseSha,
    baseRefName: "main",
    state: "OPEN",
    mergeable: "MERGEABLE",
    ...overrides,
  };
}

test("missing expected jobs and an empty check list cannot pass", () => {
  assert.equal(assessChecks(target.expectedChecks, []).state, "pending");
  const result = assessChecks(
    [...target.expectedChecks, { name: "build" }],
    [check()],
  );
  assert.equal(result.state, "pending");
  assert.deepEqual(result.missing, [{ name: "build" }]);
});

test("a check with the same name in a different workflow cannot satisfy the gate", () => {
  const result = assessChecks(target.expectedChecks, [
    check({ workflow: "Other CI" }),
  ]);
  assert.equal(result.state, "pending");
});

test("failures outside the expected list still block success", () => {
  const result = assessChecks(target.expectedChecks, [
    check(),
    check({ name: "e2e", state: "FAILURE", bucket: "fail" }),
  ]);
  assert.equal(result.state, "attention");
  assert.equal(result.concerns[0].name, "e2e");
});

test("waits for remaining jobs before returning the complete failure batch", () => {
  const failed = check({ state: "FAILURE", bucket: "fail" });
  const pending = check({
    name: "build",
    state: "IN_PROGRESS",
    bucket: "pending",
  });
  assert.equal(
    assessChecks(target.expectedChecks, [failed, pending]).state,
    "pending",
  );
  const result = assessChecks(target.expectedChecks, [
    failed,
    check({ name: "build", state: "FAILURE", bucket: "fail" }),
  ]);
  assert.equal(result.state, "attention");
  assert.equal(result.concerns.length, 2);
});

test("canceled, neutral, skipped, and unknown outcomes require attention", () => {
  for (const [bucket, state] of [
    ["cancel", "CANCELLED"],
    ["pass", "NEUTRAL"],
    ["skipping", "SKIPPED"],
    ["other", "UNKNOWN"],
  ]) {
    assert.equal(
      assessChecks(target.expectedChecks, [check({ bucket, state })]).state,
      "attention",
    );
  }
});

test("a verified skip allowance only applies to the named workflow and never excuses failure", () => {
  const expected = [{ name: "unit", workflow: "CI", allowSkipped: true }];
  assert.equal(
    assessChecks(expected, [check({ bucket: "skipping", state: "SKIPPED" })])
      .state,
    "settled",
  );
  assert.equal(
    assessChecks(expected, [check({ bucket: "fail", state: "FAILURE" })]).state,
    "attention",
  );
  const extraSkip = check({
    name: "deploy",
    bucket: "skipping",
    state: "SKIPPED",
  });
  assert.equal(assessChecks(expected, [check(), extraSkip]).state, "attention");
});

test("rejects unsafe or incomplete manifests", () => {
  for (const value of [
    { targets: [] },
    { targets: [{ ...target, expectedChecks: [] }] },
    { targets: [{ ...target, headSha: "short" }] },
    { targets: [{ ...target, number: -1 }] },
    { targets: [target, target] },
    { targets: [target], intervalSeconds: 0 },
  ])
    assert.throws(() => parseManifest(value));
});

test("does not read checks for a moved, retargeted, or closed PR", async () => {
  for (const override of [
    { headRefOid: "c".repeat(40) },
    { baseRefOid: "c".repeat(40) },
    { baseRefName: "other" },
    { state: "MERGED" },
  ]) {
    let calls = 0;
    async function query() {
      calls++;
      return view(override);
    }
    const result = await inspectTarget(target, query);
    assert.equal(result.state, "changed");
    assert.equal(calls, 1);
  }
});

test("detects a base change between fetching PR metadata and fetching green checks", async () => {
  let reads = 0;
  async function query(args: string[]) {
    if (args[1] === "checks") return [check()];
    reads++;
    return reads === 1 ? view() : view({ baseRefOid: "c".repeat(40) });
  }
  assert.equal((await inspectTarget(target, query)).state, "changed");
});

test("rejects malformed API output instead of reporting success", async () => {
  async function query(args: string[]) {
    return args[1] === "checks" ? [{}] : view();
  }
  await assert.rejects(
    inspectTarget(target, query),
    /Unexpected gh pr checks JSON/,
  );
});

test("a conflict stops before querying checks that cannot start", async () => {
  let calls = 0;
  async function query() {
    calls++;
    return view({ mergeable: "CONFLICTING" });
  }
  const result = await inspectTarget(target, query);
  assert.equal(result.state, "blocked");
  assert.equal(calls, 1);
});

test("unknown mergeability remains pending instead of passing green checks", async () => {
  async function query() {
    return view({ mergeable: "UNKNOWN" });
  }
  assert.equal((await inspectTarget(target, query)).state, "pending");
});

test("a conflict found after collecting checks blocks the result", async () => {
  let reads = 0;
  async function query(args: string[]) {
    if (args[1] === "checks") return [check()];
    reads++;
    return reads === 1 ? view() : view({ mergeable: "CONFLICTING" });
  }
  assert.equal((await inspectTarget(target, query)).state, "blocked");
});

test("a conflicted PR interrupts the batch without waiting for other checks", async () => {
  const manifest = parseManifest({
    targets: [target, { ...target, number: 13 }],
  });
  async function inspect(item: Target) {
    return {
      ...item,
      ...assessChecks(item.expectedChecks, []),
      state: item.number === 12 ? "pending" : "blocked",
    };
  }
  const result = await watchTargets(manifest, false, inspect);
  assert.equal(result.exitCode, 5);
});

test("checks every PR and returns all failures once the batch settles", async () => {
  const manifest = parseManifest({
    targets: [target, { ...target, number: 13 }],
  });
  let round = 0;
  const observed: number[] = [];
  async function inspect(item: Target) {
    observed.push(item.number);
    return {
      ...item,
      ...assessChecks(item.expectedChecks, [check()]),
      state:
        item.number === 12 ? "attention" : round === 0 ? "pending" : "settled",
    };
  }
  async function pause() {
    round++;
  }
  const result = await watchTargets(manifest, false, inspect, pause);
  assert.equal(result.exitCode, 1);
  assert.deepEqual(observed, [12, 13, 12, 13]);
  assert.equal(result.results.length, 2);
});

test("a moved ref interrupts waiting on other PRs", async () => {
  const manifest = parseManifest({
    targets: [target, { ...target, number: 13 }],
  });
  async function inspect(item: Target) {
    return {
      ...item,
      ...assessChecks(item.expectedChecks, [check()]),
      state: item.number === 12 ? "pending" : "changed",
    };
  }
  const result = await watchTargets(manifest, false, inspect);
  assert.equal(result.exitCode, 2);
});

test("persistent missing checks time out instead of silently passing", async () => {
  const manifest = parseManifest({
    targets: [target],
    intervalSeconds: 1,
    timeoutMinutes: 0.05,
  });
  let elapsed = 0;
  async function inspect(item: Target) {
    return { ...item, ...assessChecks(item.expectedChecks, []) };
  }
  async function pause(milliseconds: number) {
    elapsed += milliseconds;
  }
  const result = await watchTargets(
    manifest,
    false,
    inspect,
    pause,
    () => elapsed,
  );
  assert.equal(result.exitCode, 4);
  assert.equal(elapsed, 3000);
});

test("one-shot pending status does not sleep and settled status exits successfully", async () => {
  const manifest = parseManifest({ targets: [target] });
  async function pending(item: Target) {
    return { ...item, ...assessChecks(item.expectedChecks, []) };
  }
  async function settled(item: Target) {
    return { ...item, ...assessChecks(item.expectedChecks, [check()]) };
  }
  async function pause() {
    assert.fail("one-shot mode must not sleep");
  }
  assert.equal(
    (await watchTargets(manifest, true, pending, pause)).exitCode,
    8,
  );
  assert.equal(
    (await watchTargets(manifest, true, settled, pause)).exitCode,
    0,
  );
});
