---
name: reuse-first
description: >-
  Pablo's core engineering principles for writing and editing code: maximize
  reuse (components + design tokens over one-off values) and minimize blast
  radius (touch as few files as possible, stay modular). Use this skill
  WHENEVER writing, editing, refactoring, or reviewing code — especially
  frontend/UI work (Vue, components, styling, CSS, Tailwind, colors, fonts,
  buttons, spacing). Trigger even when the user doesn't explicitly ask for
  "reuse" or "tokens": any time you're about to add a color, font, size,
  button, dialog, card, or repeated markup, consult this skill first. A raw
  hex value, an inline font, or a duplicated component is a red flag this
  skill exists to catch.
metadata:
  type: feedback
---

# Reuse-first, minimal-impact code

Two principles govern how Pablo wants code written. They compound: reused
building blocks are what *let* a change stay small. Internalize the *why* so you
apply them to situations these examples don't literally cover.

## Principle 1 — Maximize reuse

**Every value and every piece of UI should come from a shared, named source of
truth.** A literal value hardcoded inline is a defect waiting to happen: it can't
be themed, it drifts out of sync, and it hides the fact that the concept already
exists elsewhere.

Before you write anything, search for what already exists and use it:

- **Colors** — use a design token / CSS variable / Tailwind theme value. A raw
  hex (`#3b82f6`), `rgb(...)`, or named color that isn't *defining* a token is a
  red flag. If the color you need has no token, add the token, then reference it.
- **Fonts, spacing, sizes, radii, shadows** — same rule. Pull from the type
  scale / spacing scale / token set. Don't sprinkle `font-family`, magic pixel
  values, or one-off `px` measurements inline.
- **UI elements** — buttons, dialogs, cards, tables, inputs, badges. Reuse the
  existing component (check `components/` and the PrimeVue library) instead of
  hand-rolling markup. If you find yourself copy-pasting a block of template a
  second time, that's the signal to extract a component.
- **Logic** — repeated behavior belongs in a composable (`use*`) or util, not
  duplicated across files.

**When the building block doesn't exist yet:** create it *once*, in the right
shared location, then consume it everywhere — including the spot that prompted
it. Creating a token/component is not scope creep; it's the point. What you must
avoid is the one-off literal.

Quick gut check before committing any UI/style code: *scan the diff for hex
values, inline fonts, magic numbers, and duplicated markup.* If you see one and
it isn't the single place defining a token/component, fix it.

## Principle 2 — Minimize the blast radius

**Prefer the change that touches the fewest files and stays self-contained.**
Small, modular changes are easier to review, safer to ship, and simpler to
revert. This is why Pablo works in tightly-scoped PRs.

- Localize the change. Add or edit within the module that owns the concern
  rather than threading edits through many files.
- Add new, contained units (a new component, a new composable, a new token)
  in preference to widening the signatures or rewriting the internals of things
  many callers depend on.
- Don't refactor adjacent code, rename things, or "clean up while you're here"
  unless the task asks for it — every extra touched file is extra risk and
  review burden.
- When there are two ways to achieve the same result, pick the one with the
  smaller footprint and fewer cross-file dependencies.

## The tension, resolved

These two can appear to conflict: extracting a shared component *adds* a file.
That's fine — a new, self-contained building block has a **small blast radius**
(nothing existing has to change to accommodate it) while **paying off reuse**.
The thing to avoid is the opposite: duplicating a literal or a block of markup,
which spreads the same concept across many files *and* skips reuse. When in
doubt, add a contained, reusable unit rather than editing many existing ones or
inlining a one-off.

## Apply this proactively

You don't need to be asked. Any time a task involves a color, font, size,
button, or repeated markup, reach for the token/component path by default and
keep the edit tight. If the right token or component is missing, say so briefly
and create it rather than falling back to a literal.
