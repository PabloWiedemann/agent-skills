---
name: sync-skills-repo
description: Sync the skills installed on Pablo's Mac (~/.agents/skills, ~/.cursor/skills, ~/.claude/skills — anything added with `npx skills add`) into his private GitHub repo PabloWiedemann/agent-skills, which his cloud coding agents (Cursor, Conductor) download at build time. Use whenever Pablo says "sync my skills", "push my skills", "update the skills repo", "I installed a new skill", "prune my skills", or mentions running npx skills add. Pablo is a design engineer who prototypes and ships front-end code (ComfyUI Vue/TS frontend, Electron desktop app, Nuxt platform) — judge skill fit through that lens.
---

# Sync skills repo

Files next to this SKILL.md: `sync.sh` (copies allowlisted skills to the repo and pushes), `prune.sh` (deletes non-allowlisted skills from the Mac, asks first), `new-skills.sh` (lists undecided skills), `allowlist.txt`, `rejected.txt`. Never edit skill contents. Never delete anything without running `prune.sh` and getting a YES from Pablo.

## Flow

1. **Find what's new.** Run `bash <this folder>/new-skills.sh`. Each line is `name <TAB> description`.
   - If it prints nothing: say "No new skills since last sync," then run `bash <this folder>/sync.sh` and report the result. Done.

2. **Rate the new ones.** Show ONE markdown table with columns: Skill · What it does (one short line) · Fit · Why (≤8 words). Sort: Good fit first, then Medium, then Probably not.
   - **Good**: front-end design/polish, animation, typography, color, accessibility, UX copy, Vue/TypeScript/Tailwind/Playwright/Vitest, Electron, Nuxt, PR/commit hygiene, code review, clean code.
   - **Medium**: general web dev, React (he mostly writes Vue, but prototypes sometimes), design systems, testing, tooling that speeds shipping.
   - **Probably not**: backend/infra/cloud vendors, security pentesting, marketing/sales/CRM, mobile-native, data science, anything unrelated to shipping UI. Also skills that duplicate one already in the allowlist — say which one.
   End with: "Default: add Good, skip the rest. Say 'go', or tell me changes in plain words (e.g. 'add X, drop Y, keep Z for now')."

3. **Apply the decision.** After Pablo answers:
   - Append accepted names to `allowlist.txt` (one per line, no comments needed).
   - Append rejected names to `rejected.txt` so they're never asked again. "Keep for now / not sure" = don't write anywhere; it'll show up next time.
   - Run `bash <this folder>/sync.sh`. Report in two lines: what got pushed (or "nothing changed"), and whether push succeeded. If push fails with an auth error: tell him to run `gh auth login` in Terminal, then say "sync my skills" again.

4. **Offer cleanup once.** If anything was rejected, ask: "Want me to remove the rejected ones from your Mac too? (runs prune.sh, shows the list, needs your YES)". Only run it if he says yes.

5. **Remind the last step.** End with: "To get them into cloud agents: Cursor → repo environment → ⋯ → Trigger build; Conductor → Cloud computer → Build computer."

## Editing the lists on request
"Add X to my skills" / "remove X from the repo" / "forget X" → edit `allowlist.txt` / `rejected.txt` accordingly, then run `sync.sh`.
