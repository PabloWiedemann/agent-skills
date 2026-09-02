# UI/UX essentials

Distilled interface best practices, condensed from the `better-ui`,
`better-colors`, `better-layout`, `better-writing`, `better-typography`,
`better-accessibility`, and `better-interface` skills. Self-contained: apply
these directly when those skills are not installed. When they *are* installed,
invoke the relevant one for depth — this file is the floor, not the ceiling.

Throughout: preserve the project's established tokens, density, motion
language, and voice. These rules guide new decisions; they are not a license
to restyle what already exists.

## Layout and hierarchy

- **Group with space, not lines.** Negative space is the primary grouping
  tool; separator lines are the last resort. The gap *between* groups must be
  at least 2× the gap *within* a group (8px intra → 16px+ inter), or the
  grouping reads as noise.
- **Align to shared edges.** Pick alignment edges and stick to them; every
  stray edge reads as noise. Use one spacing step per level of subordination.
- **Order by importance.** The most important content sits near the top and
  the leading edge. Think leading/trailing, not left/right; use logical
  properties (`padding-inline-start`) in localizable layouts.
- **Controls look interactive.** A control needs a background shape, border,
  or consistent placement zone — never styled identically to static text.
- **Hint at hidden content.** Progressive disclosure needs a visible cue: let
  the next carousel item peek 16–32px past the edge, or show a disclosure
  control. Content hidden with zero cue may as well not exist.
- **Breakpoints come from content**, not device presets. Hold the expanded
  layout as long as it genuinely fits; prefer container queries for
  component-level adaptation. Test the smallest and largest sizes first.
- **Plan for text growth.** No fixed widths/heights on text containers; let
  rows wrap. Translations grow unpredictably.
- **Content bleeds, controls float.** Backgrounds and media may extend to the
  viewport edge; text and controls stay inside layout margins and safe areas.

## Color

- **Semantic tokens by role.** Every color comes from the token system, named
  for its role. One color, one meaning: if blue is the link color, don't
  reuse it decoratively — give the second use a neutral.
- **One primary action per view.** Fill only the single primary action with
  the accent; secondary actions stay neutral. Several colored control
  backgrounds in one view compete and cancel out.
- **Respect the existing notation.** Don't introduce OKLCH into a hex
  codebase (or vice versa) for an isolated fix; a consistent token system
  beats a superior color space applied inconsistently.
- **Contrast is measured, not eyeballed.** Body text: WCAG 4.5:1 / APCA
  |Lc| ≥ 75 against its actual background. Check both themes — dark mode is
  not a mechanical inversion of light; retune and re-measure every
  foreground/background pair.
- **States derive from the base.** Hover/selected/disabled come from the base
  token programmatically (opacity, `color-mix()`, modifier classes), not from
  parallel hand-picked colors that drift.

## Visual polish and motion

- **Concentric border radius.** Outer radius = inner radius + padding.
  Equal nested radii is the most common thing that makes UI feel off.
- **Optical over geometric alignment.** Play icons, asymmetric glyphs, and
  icon+text buttons need manual nudging when geometric centering looks wrong.
- **Shadows for elevation, borders for structure.** Fake-depth borders become
  layered transparent shadows; keep borders that communicate structure or
  state (dividers, selection, focus).
- **Interruptible animation.** CSS transitions for interactive state changes
  (they can reverse mid-flight); keyframes only for one-shot sequences.
  `ease-out` for both enters and exits; exits softer and smaller than enters.
- **Motion restraint.** No custom animation on high-frequency interactions —
  the attention cost repeats every trigger. Motion is never the only feedback
  channel; every animated change needs a static cue too. Skip entrance
  animations on initial page load.
- **Press feedback**: `scale(0.96)` on click — never below `0.95`.
- **Never `transition: all`.** Name the exact properties.
- **Icons**: one set, one stroke weight, sized to the text they sit beside;
  `currentColor` with states from CSS — never separate assets per state.
  Outline is the default; fill marks active.

## Interface copy

- **Verb-first buttons.** Labels name the specific action: "Save draft",
  "Delete project" — never "OK!"/"Yes" on consequential actions. Confirmation
  buttons repeat the consequence so the dialog is answerable without the
  body text.
- **One flow vocabulary.** Pick "Continue" *or* "Next" and keep it through
  the flow; alternating synonyms implies different behavior.
- **Errors say how to fix, next to where it broke.** "Choose a password with
  at least 8 characters", inline at the field — not "Invalid password", not
  "Oops! Something went wrong", no blame, no exclamation marks.
- **Empty states point forward.** Say what this place is and offer the next
  action ("No projects yet … Create a project"), never a bare "No results."
- **Placeholders are examples, not labels.** They vanish on input; every
  field keeps a visible label.
- **Toggles label the ON state.** "Send read receipts", never a negative that
  creates a double negative.
- **Links describe their destination.** "Read the billing docs", never
  "Click here" or a bare repeated "Learn more".
- **One capitalization policy** per element type; sentence case is the safer
  default. "Save Changes" beside "Discard changes" reads as sloppiness.
- **i18n-safe strings.** Full templated strings with real pluralization —
  never concatenate fragments around variables; word order changes per
  language. Match the device verb: tap (touch), click (pointer), select
  (both).
- **Tone flexes with stakes**: warm in success/onboarding, neutral in
  settings, calm and plain in errors and destructive confirmations — zero
  playfulness where data or money is at risk.

## Accessibility (minimum bar)

- Every interactive element is keyboard-reachable, in a logical tab order,
  with a visible focus state (`:focus-visible`).
- Icon-only controls get an accessible name (`aria-label`); decorative icons
  are hidden from the accessibility tree.
- Hit areas ≥ 44×44px (or per the platform's standard), even when the visual
  glyph is smaller; adjacent expanded hit areas must not overlap.
- Every form field has a visible, programmatically associated label; errors
  are announced (`aria-invalid`, live region), not just colored.
- Color is never the only signal — pair it with an icon, label, or weight
  change.
- Respect `prefers-reduced-motion`: gate non-essential animation behind it.

## Typography (minimum bar)

- All font families, sizes, and weights come from the project's type scale —
  never inline.
- Body line length ≈ 45–75 characters; set `max-width` in `ch` when needed.
- Numbers that align vertically (tables, timers, prices) use tabular figures
  (`font-variant-numeric: tabular-nums`).
- Truncation (`line-clamp`) must never hide the only path to critical
  content; prefer wrapping.
- Minimum 16px font size on mobile inputs (prevents iOS zoom-on-focus).

## The states walk

Before calling any UI change done, walk every state it touches: default,
hover, focus, active, disabled, loading, empty, error, overflowing content,
narrow viewport, and both themes. Most UI defects live in the states nobody
rendered during development.
