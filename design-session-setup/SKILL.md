---
name: design-session-setup
description: Set up a UI design-tuning session — install DialKit locally (never committed, guarded by a pre-commit hook) and load the design + polish guidelines. Use when starting visual or UI refinement work in a frontend app.
---

# Design session setup

Run these steps in order when this skill is invoked.

## 1. Set up local tooling (DialKit + commit guard)

Run the setup script from the repo root:

```bash
bash ~/.claude/scripts/dialkit-guard.sh
```

This installs DialKit with `--no-save` (so it never enters `package.json` or the lockfile) and arms a pre-commit hook that blocks committing any DialKit code. Report to the user whether it succeeded.

Wiring DialKit into a component (this is a Nuxt / Vue 3 app): import from `dialkit/vue`, add `<DialRoot />` near the app root, and register knobs with `useDialKit(...)` inside the component being tuned.

## 2. Load design guidance

Invoke the `make-interfaces-feel-better` skill now to load the polish principles for this session.

Also consult, when relevant to the work:
- `frontend-design` — when creating or reshaping UI and choosing aesthetic direction.
- `reuse-first` — ALWAYS when baking tuned values back into code: use design tokens and existing components, never one-off hex values or magic numbers.
- `oklch-skill` — when tuning or generating colors.

## 3. Working rules for this session

- DialKit wiring is temporary scaffolding. The only permanent output is the tuned values.
- Once a value is dialed in, bake it into the real code or a design token (per `reuse-first`) — do not leave it as a DialKit-bound value.
- Remove ALL DialKit wiring (`<DialRoot />`, `useDialKit(...)`, imports) before committing. The pre-commit guard will block the commit if any remains.

## 4. Before committing

- Invoke the `web-design-guidelines` skill to review the UI changes (accessibility, interaction, layout) before finalizing.
- Confirm no DialKit wiring remains, then commit as normal.

## Extending this skill

This file is the checklist. To add a step to the session setup (start dev server, load specific tokens, run a linter, etc.), just add it as a numbered item above.
