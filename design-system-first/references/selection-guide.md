# Selecting the right tokens and components

How to find what the repo already has, choose between candidates, and decide
when creating something new is justified. The repository's own style is the
primary evidence — infer from it before applying any general rule.

## Step 1 — Recon the system (once per session)

Before the first UI edit in a repo, build a mental inventory. Spend 2–5
minutes; it pays for itself on every subsequent decision.

**Where tokens live** — check, in order:

1. Project docs: `CLAUDE.md`, `AGENTS.md`, `docs/`, `CONTRIBUTING.md` — many
   repos state their design-system rules outright. Those rules override
   anything generic.
2. Theme configuration: `tailwind.config.*`, Tailwind v4 `@theme` blocks,
   `theme.ts`, styled-system config.
3. CSS custom properties: global stylesheets (`style.css`, `tokens.css`,
   `variables.css`), or an imported design-system package
   (`@scope/design-system`).
4. Component-library theming: PrimeVue theme presets, MUI theme, shadcn
   `globals.css`.

Useful searches:

```bash
grep -rn --include="*.css" -- "--color-" src/ | head        # custom properties
grep -rn "@theme" src/                                       # Tailwind v4 tokens
ls src/components src/composables src/lib 2>/dev/null        # shared inventory
```

**Where components live:**

1. The shared component directory (`components/`, `components/common/`,
   `components/ui/`) — read the folder names; they are a table of contents.
2. The installed component library (`package.json`: PrimeVue, Radix, shadcn,
   MUI, etc.). Library components count as existing components — check them
   before hand-rolling anything.
3. Storybook (`pnpm storybook` / `.storybook/`) — the fastest catalog of what
   exists and which variants each component supports.

**Conventions:** note the styling mechanism (Tailwind utilities vs CSS
modules vs CSS-in-JS), naming patterns, and how the most recently touched
components are written. Express every change in the mechanism the repo
already uses — never introduce a second styling approach for an isolated fix.

## Step 2 — Selecting a token

1. **Name the role first.** Before looking at any values, state what the
   value *does*: "border between list rows", "text on an elevated surface",
   "spacing between form groups". The role is the search key.
2. **Search tokens by role name**, not by value. `--border-default`,
   `--surface-secondary`, `--text-muted`. If token names are semantic, trust
   the names.
3. **Check precedent.** Find the closest analogous UI (another list, another
   card) and use exactly the token it uses. Two screens with the same role
   using different tokens is a bug — don't add a third variant.
4. **Never select by matching value.** A raw-palette step (`gray-200`,
   `--color-ash-300`) that happens to match the intended color is the wrong
   choice when a semantic token for the role exists: when the theme is
   retuned, value-matched picks drift. Reach for raw palette steps only where
   the repo itself uses them directly.
5. **Respect theming.** Prefer tokens that already resolve per-theme over
   hand-written dark-mode overrides. If the repo's semantic tokens handle
   light/dark automatically, adding a manual override is a red flag.

**When no token fits the role:** add one (reuse ladder rung 4). Define it in
the same file and notation as its siblings, name it by role (not by value —
`--surface-warning`, never `--light-yellow`), give it values for every theme
the repo supports, then consume it. Before adding, search for a near-synonym:
`muted` vs `subtle` vs `secondary` — if one exists, use it instead of
introducing a competing name.

## Step 3 — Selecting a component

Walk the reuse ladder concretely:

1. **Exact match** — search the shared directory and the component library by
   concept and synonyms (dialog/modal/popup; badge/chip/tag; select/dropdown).
   Check Storybook.
2. **Configure** — read the candidate's props/slots/variants before deciding
   it doesn't fit. Most "this component can't do X" conclusions are wrong;
   check for `variant`, `size`, `severity` props and slot escape hatches.
3. **Compose** — build the feature from existing primitives (existing card +
   existing button + existing spacing scale) with no new abstraction.
4. **Extend** — the candidate almost fits: add a variant or prop *to the
   shared component itself*, keeping its existing API style (if variants are
   strings, add a string variant, not a boolean). All existing callers must
   be unaffected.
5. **Create shared** — nothing close exists. Build the new component in the
   canonical shared location, styled entirely with tokens, following the
   sibling components' conventions (naming, props, events, story/test if the
   repo has them). Then consume it at the site that prompted it.

**Never** hand-roll markup that visually imitates an existing component, and
never fork a component to change its styling — that creates the divergence
this skill exists to prevent.

**Wrapper rule:** if the same library component keeps being configured with
the same cluster of props/classes in multiple places, extract a thin shared
wrapper that encodes the house style, and use it everywhere.

## Step 4 — Choosing between plausible candidates

When several existing options could work:

| Tiebreaker | Rule |
| --- | --- |
| Precedent | Match the choice made by the most similar existing screen. |
| Specificity | Prefer the component built for the purpose over the generic one (a `ConfirmDialog` over a bare `Dialog`). |
| Semantic fit | Prefer the option whose *name* matches the role, even if another can be styled to look identical. |
| Weight | Prefer the lighter option when purpose-fit is equal — don't pull in a data-table component to render a two-row list. |

If the repo itself is inconsistent (two dialogs, three button styles), match
the *newest, most-used* pattern, note the inconsistency to the user, and do
not add a third variant.

## Step 5 — Creating something new, correctly

When rung 5 is genuinely reached:

- **Location**: the canonical shared directory, next to its most similar
  sibling — never inside the feature folder that prompted it (unless the repo
  intentionally scopes components per-feature; then follow that convention).
- **Naming**: by role and content, matching the sibling naming style.
- **API**: smallest set of props that serves the known call sites; events
  out, props in; string variants over booleans that multiply.
- **Styling**: 100% tokens and scale values — a new component with hardcoded
  values just moves the defect somewhere reusable.
- **Discoverability**: add the story/doc entry if the repo keeps them —
  an undiscoverable component will be duplicated next month.
- **Scope discipline**: consume it at the new call site. Do *not* migrate
  every old near-duplicate in the same change — that widens the blast radius;
  mention the follow-up instead.
