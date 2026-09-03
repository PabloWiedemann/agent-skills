---
name: design-system-first
description: >-
  Design-system-first engineering principles for writing and editing code.
  The design system is the single source of truth; maximize reuse (semantic
  tokens + shared components over one-off values), keep changes modular with
  minimal blast radius, and apply UI/UX best practices. Use WHENEVER writing,
  editing, refactoring, or reviewing code — especially frontend/UI work (Vue,
  React, components, styling, CSS, Tailwind, colors, fonts, spacing, buttons,
  dialogs). Trigger even when reuse isn't mentioned, any time code is about
  to contain a color, font, size, button, card, repeated markup, or
  user-facing text. A raw hex value, an inline font, a magic number, or a
  duplicated component is a red flag this skill exists to catch.
---

# Reuse-first, design-system-driven code

The design system is the single source of truth. Every value, every piece of UI,
and every repeated behavior comes from a shared, named source — never from an
inline literal or a one-off copy. The goals compound:

- **Consistent UX** — users see one coherent product, not a patchwork.
- **Maximal reuse** — the system grows deliberately, not into infinite
  near-duplicate components and tokens.
- **Modular code** — small, self-contained units with minimal blast radius.
- **Good UI/UX** — selections and new work follow interface best practices.

Internalize the *why* so the principles apply to situations these examples
don't literally cover.

## The Workflow

Every UI or styling task follows the same loop:

1. **Recon** — inventory what the repo already has: token files, theme config,
   component directory, component library, Storybook, and the most similar
   existing screen. Follow [selection-guide.md](references/selection-guide.md).
2. **Select** — pick tokens by *role* and components by *purpose*, mirroring
   how the nearest analogous screen does it.
3. **Implement** — express the change entirely in the project's existing
   system; create a shared building block only when the ladder below requires
   it.
4. **Self-check** — scan the diff for the red flags listed at the end before
   declaring the work done.

In ComfyUI repositories, also read
[comfy-stack.md](references/comfy-stack.md) for the concrete stack rules.

## Principle 1 — The reuse ladder

Before writing anything, climb this ladder from the top. Stop at the first
rung that works; never fall off the bottom.

| Rung | Action |
| --- | --- |
| 1. Use as-is | An existing token, component, or composable already does it. |
| 2. Configure | The existing component covers it via props, slots, or variants. |
| 3. Compose | Combine existing primitives (layout + button + token) without new abstractions. |
| 4. Extend the shared source | Add a variant, prop, or token *in the shared location*, then consume it. |
| 5. Create a shared unit | Build a new component/token/composable in the canonical shared place, named by role, and consume it — including at the call site that prompted it. |
| ∅ Never | An inline literal, a hand-rolled clone of an existing component, or a local one-off style. |

Creating a shared component at rung 5 is not scope creep — it is the point.
What must never happen is the one-off: a raw `#3b82f6`, an inline
`font-family`, a magic `13px`, or a second copy-pasted block of markup. A
literal can't be themed, drifts out of sync, and hides that the concept
already exists.

**Tokens climb a shorter ladder than components.** "No hardcoded values"
must not flip into "mint a token for every unmatched value" — a token set
that grows per-feature stops being a system. For tokens the default is
always the *nearest existing* token, and rungs 4–5 require either a clearly
recurring role or the developer's explicit go-ahead (see Principle 2).

**Extraction trigger:** copying a block of template or logic a *second* time
is the signal to extract a component or composable. Repeated behavior belongs
in a `use*` composable or util, not duplicated across files.

## Principle 2 — Select by role, not by looks

The most common failure is picking a token because its *value* looks right or
hand-rolling markup because it *looks* simple. Select semantically:

- **Tokens**: choose the token whose *name describes the role* the value plays
  (`--border-default` for a border, never a gray that happens to match).
  Borrowing a token outside its role is as bad as a literal — when the token
  is retuned, every borrowed use breaks.
- **Components**: choose by purpose. A confirmation belongs in the existing
  dialog component, even if a hand-rolled div would look identical today.
- **Precedent**: when two candidates both fit, find the closest analogous
  screen in the repo and copy its choice. Consistency with siblings beats
  personal preference every time.
- **Reference designs are intents, not specs.** When a Figma link, mockup,
  or screenshot contains values the token set doesn't cover exactly, map
  each value to the *nearest existing token* for its role — small deltas
  from the reference are expected and correct. Do not mint new tokens to
  chase exact design values.
- **Ask, don't invent, in the gray zone.** Stop and ask the developer —
  presenting 2–3 concrete options with a recommendation — when the nearest
  token is *meaningfully* different from the reference value, or when the
  value is semantically unlike every existing token and appears only once
  outside any reusable component. The options are typically: nearest token
  (accept the drift), a new semantic token (only if the role will recur), or
  a scoped one-off constant with a comment.
- **Missing component role**: if no component covers the purpose, that is
  rung 4–5 of the ladder — extend or add in the shared source, don't
  approximate with hand-rolled markup.

Full decision procedure, search recipes, and naming rules:
[selection-guide.md](references/selection-guide.md).

## Principle 3 — Minimize the blast radius, stay modular

Prefer the change that touches the fewest files and stays self-contained.
Small, modular changes are easier to review, safer to ship, and simpler to
revert.

- **Localize.** Add or edit within the module that owns the concern rather
  than threading edits through many files.
- **Add contained units** — a new component, composable, or token — in
  preference to widening signatures or rewriting internals that many callers
  depend on.
- **Keep units single-purpose.** A component renders one concept; logic lives
  in composables; data access lives in stores/services. No god components.
- **Design narrow contracts.** Props in, events out. Don't reach into a
  component's internals or export more than callers need.
- **No drive-by refactors.** Don't rename, restructure, or "clean up while
  you're here" unless the task asks for it — every extra touched file is
  extra risk and review burden.
- **Two equivalent solutions?** Pick the one with the smaller footprint and
  fewer cross-file dependencies.

**The tension, resolved:** extracting a shared component *adds* a file, and
that's fine — a new self-contained building block changes nothing that exists,
while paying off reuse. The thing to avoid is the opposite: duplicating a
literal or markup block, which spreads one concept across many files *and*
skips reuse. When in doubt, add a contained reusable unit rather than editing
many existing ones or inlining a one-off.

## Principle 4 — Good UI/UX by default

Reused components inherit their quality from the system, but layout,
composition, copy, and states are decided per feature. Apply the distilled
best practices in [ui-ux-essentials.md](references/ui-ux-essentials.md)
whenever building or changing UI, covering:

- Layout and hierarchy (group with space, align to shared edges, order by
  importance)
- Color usage (semantic roles, one meaning per color, one primary action,
  contrast)
- Polish and motion (concentric radii, shadows vs borders, restrained,
  interruptible animation)
- Interface copy (verb-first buttons, errors that say how to fix, empty
  states that point forward)
- Accessibility and typography essentials

**Escalate to the specialist skills when installed.** If the `better-*`
skills are available in the environment, invoke them for depth instead of
relying only on the distilled file:

| Situation | Skill |
| --- | --- |
| Visual polish, animation, shadows, icons | `better-ui` |
| Color decisions, palettes, contrast, theming | `better-colors` |
| Page/component structure, spacing, breakpoints | `better-layout` |
| Any user-facing text | `better-writing` |
| Holistic review of a screen or flow | `better-interface` |
| Fonts, type scale, truncation | `better-typography` |
| Keyboard, focus, ARIA, hit areas | `better-accessibility` |

If they are not installed, the distilled reference stands on its own.

## Self-check — scan the diff before finishing

Before committing or handing back any UI/style change, scan the diff for
these red flags. Each one is a defect unless it is the *single defining
declaration* of a new token or component:

| Red flag | Fix |
| --- | --- |
| Raw hex / `rgb()` / named color | Use or add the semantic color token |
| Inline `font-family`, font size, or weight literal | Use the type scale |
| Magic pixel value for spacing, radius, shadow | Use the spacing/radius/shadow scale |
| Copy-pasted markup block | Extract or reuse a component |
| New component near-duplicating an existing one | Extend the existing one with a variant |
| New token duplicating an existing role | Reuse the existing token |
| New token minted to match one reference-design value | Use the nearest existing token, or ask the developer if it's meaningfully different |
| New UI built on a library the repo has deprecated | Use the sanctioned library — check docs/lint, not just `package.json` |
| Token or component chosen by value, not role | Re-select semantically |
| Hardcoded user-facing string where the repo uses i18n | Add the locale entry |
| Style override fighting the component's own API | Use the prop/variant, or extend it |
| Edits sprawled across unrelated files | Re-scope to the owning module |

Also verify the states the diff touches: hover, focus, disabled, loading,
empty, error, and both light and dark themes where applicable.

## Apply this proactively

No one needs to ask. Any time a task involves a color, font, size, button,
dialog, repeated markup, or user-facing text, reach for the token/component
path by default and keep the edit tight. If the right building block is
missing, say so briefly and create it in the shared source rather than
falling back to a literal.
