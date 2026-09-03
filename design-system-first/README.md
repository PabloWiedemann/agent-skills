# design-system-first

An [Agent Skill](https://skills.sh) that makes coding agents treat the
**design system as the single source of truth** whenever they write or edit
code:

- **Maximize reuse** — semantic tokens and shared components over raw hex
  values, magic numbers, and one-off markup. Climb the reuse ladder
  (use → configure → compose → extend → create shared) and never fall off
  the bottom into an inline literal.
- **Select by role, not by looks** — pick the token whose name matches the
  role, the component whose purpose matches the job, and mirror the closest
  existing screen.
- **Minimize blast radius** — small, modular, self-contained changes; no
  drive-by refactors.
- **Good UI/UX by default** — distilled layout, color, motion, copy,
  accessibility, and typography best practices, with escalation to the
  `better-*` skills when installed.
- **No token sprawl** — reference designs (Figma, mockups) map to the
  *nearest existing* token, never to freshly minted ones; in genuinely
  ambiguous cases the agent asks the developer with recommended options
  instead of inventing.
- **Comfy-aware** — a reference file encodes the ComfyUI frontend stack
  (Vue 3 + Reka UI + Tailwind 4 + `@comfyorg/design-system` tokens, Figma
  as the design source of truth).

## Install

```bash
npx skills add PabloWiedemann/design-system-first-skill -g
```

`-g` installs for all your projects (`~/.claude/skills/` for Claude Code);
omit it to install into the current project only. Works with Claude Code,
Cursor, Codex, Copilot, and the other agents the
[skills CLI](https://skills.sh/docs/cli) supports — pass `--agent` to choose.

## Update

```bash
npx skills update
```

## Layout

```
├── SKILL.md                        # core principles + self-check
└── references/
    ├── selection-guide.md          # how to pick tokens & components
    ├── ui-ux-essentials.md         # distilled UI/UX best practices
    └── comfy-stack.md              # ComfyUI frontend specifics
```

The skill triggers automatically on any code-writing task that involves
colors, fonts, spacing, components, styling, or user-facing text — no need
to invoke it by name.
