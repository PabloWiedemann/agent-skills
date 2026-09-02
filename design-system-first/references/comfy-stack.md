# Comfy frontend stack reference

Concrete rules for ComfyUI repositories (`ComfyUI_frontend` and related
workspaces). This file is a snapshot — the repo's own `AGENTS.md` /
`CLAUDE.md` and `docs/guidance/*.md` (especially `design-standards.md`) are
authoritative and override this file wherever they diverge. Skim them at the
start of a session.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Vue 3.5+ SFCs, Composition API only, TypeScript only |
| Styling | Tailwind CSS v4 — avoid `<style>` blocks in components |
| Component library | PrimeVue (+ `@primevue/forms`, `@primeuix/*`) |
| Tokens | `@comfyorg/design-system` workspace package (CSS custom properties, imported via `src/assets/css/style.css`) |
| Class utility | `cn()` from `@comfyorg/tailwind-utils` for conditional class merging |
| State | Pinia stores (`*Store.ts`) |
| Logic reuse | Composables `useXyz.ts` in `composables/`; VueUse is available |
| Text | vue-i18n — raw text in templates is lint-blocked; every user-facing string gets a locale entry |
| Catalog | Storybook (`pnpm storybook`) |
| Package manager | pnpm workspaces — use `pnpm`/`pnpx`, never `npx` |

## Source-of-truth chain

Design decisions flow one way; never shortcut a link:

**Figma "Comfy Design Standards"** → **`@comfyorg/design-system` tokens** →
**Tailwind v4 semantic utilities** → **shared components** → feature code.

- The Figma file (fileKey `QreIv5htUaSICNuO2VBHw0`) is the design source of
  truth; `docs/guidance/design-standards.md` lists its section node IDs
  (hover states, click targets, affordances, feedback, design pillars).
  Fetch it live via the Figma MCP when implementing designed components.
- Map Figma token names directly to Tailwind semantic tokens — never
  hardcode the hex values shown in Figma.

## Token rules

- Use **semantic tokens** (`--base-background`, `--border-default`,
  `--accent-primary`, `--button-surface`, …) via their Tailwind utilities.
  The raw palette (ash/azure/smoke/charcoal scales) exists underneath, but
  reach for it only where the codebase itself does.
- **Avoid `dark:` variants.** Semantic tokens resolve per-theme; a `dark:`
  override on top of them is a red flag.
- **Skip Figma `-hover` / `-selected` tokens.** Those exist only for
  prototype demos. Derive interactive states programmatically —
  `color-mix()`, opacity, or Tailwind modifier classes on the base token.
- **Color tiers**: Base = default surfaces, Secondary = elevated surfaces
  (sidebars, cards), Tertiary = elements on modal panels. Pick the tier that
  matches the surface's elevation role.

## Component rules

- Search `src/components/` first — it is organized by domain plus shared
  folders (`common/`, `button/`, `card/`, `chip/`, `dialog/`, `icons/`, …) —
  then PrimeVue, then Storybook, before building anything.
- Components communicate via `emit`/`@event-name` for state changes;
  `defineExpose` only for imperative operations (`form.validate()`,
  `modal.open()`).
- Naming: components `PascalCase.vue`, composables `useXyz.ts`, stores
  `*Store.ts`.
- Icons come through the project's icon pipeline (iconify/unplugin-icons +
  `primeicons`) — don't paste raw SVG markup into templates.

## Done means checked

Before handing back a change: `pnpm typecheck`, `pnpm lint`, `pnpm format`,
plus the relevant `pnpm test:unit` — and the self-check diff scan from
SKILL.md.
