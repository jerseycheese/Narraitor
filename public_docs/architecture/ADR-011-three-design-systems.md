---
title: "ADR-011: Three structurally-differentiated design systems (DS1/DS2/DS3)"
tags: [architecture, decision, adr, design-system, theming]
created: 2026-05-10
updated: 2026-05-10
---

# ADR-011: Three structurally-differentiated design systems (DS1/DS2/DS3)

**Status**: Accepted - Implemented (canon-surface ordering superseded by [ADR-012](ADR-012-storybook-single-canon-surface.md); design-system architecture superseded by [ADR-013](ADR-013-collapse-to-single-design-system-ds3.md))
**Date**: 2026-05-10

> **Note (2026-06-28):** The "canon order: showcase pages > Storybook > app" decision below was reversed by [ADR-012](ADR-012-storybook-single-canon-surface.md) — Storybook is now the single canon surface and the `/dev/design-system*` showcase routes were retired. The three-design-system architecture (DS1/DS2/DS3, `data-theme` switching, structural differentiation) described here is unchanged.

> **Note (2026-07-11):** The three-design-system architecture itself — DS1/DS2/DS3, `data-theme` switching, structural differentiation — is superseded by [ADR-013](ADR-013-collapse-to-single-design-system-ds3.md). Nobody had ever asked for per-theme switching, and running three structurally-different themes across light/dark was a real maintenance and QA tax with no offsetting demand, so DS1 and DS2 were deleted and DS3 became the app's only design system. The rest of this document is a historical record of a decision that was correct at the time — it is not describing current app behavior.

## The Situation

Narraitor started with a single visual treatment built around shadcn/ui defaults plus a small set of semantic tokens. As we got further into the storytelling experience, the single look started to feel limiting — the app was supposed to support wildly different fictional worlds (cyberpunk, fantasy, horror, mystery), but every screen looked the same regardless of what world you were playing in.

The first instinct was to lean on tokens harder — swap a color palette, change the font stack, call it a "theme." We tried that approach in prototypes and it kept reading as same-y. Different colors over the same component shapes still felt like one app with three skins, not three distinct visual environments. The shape of a card, the rhythm of vertical spacing, the way labels sat next to inputs — those structural choices were doing more visual work than any color swap could undo.

The other issue was that the app's own dev/showcase pages weren't keeping up. A theme without a clear visual canon can drift fast — six components in, nobody remembers what radius is "right" for this theme, and the theme starts to mean "whatever I put in this PR."

This ADR captures the structural-differentiation approach we landed on for the [DS migration epic (#1020)](https://github.com/jerseycheese/Narraitor/issues/1020), shipped via [PR #1081](https://github.com/jerseycheese/Narraitor/pull/1081).

## What We Decided

Three design systems, each with its own token file, switched at the root via a `data-theme` attribute on `<html>`:

- **DS1 — "The Drafting Table"**: sharp lines, archival ink, graph paper grid. Lora / IBM Plex Mono / IBM Plex Sans. `--radius-md: 4px`.
- **DS2 — "Warm Earth"**: organic earth tones, soft forms, breathing space. Crimson Pro / JetBrains Mono / Manrope. `--radius-md: 12px`.
- **DS3 — "The Mechanical Manuscript"**: aged paper, drafting ink, dot grid aesthetic. Newsreader / Fira Code / DM Sans. `--radius-md: 6px`.

Each theme lives in its own file:

- [src/lib/theme/themes/ds1.css](../../src/lib/theme/themes/ds1.css)
- [src/lib/theme/themes/ds2.css](../../src/lib/theme/themes/ds2.css)
- [src/lib/theme/themes/ds3.css](../../src/lib/theme/themes/ds3.css)

The switching mechanism is in [src/lib/theme/ThemeProvider.tsx](../../src/lib/theme/ThemeProvider.tsx) — a small React context that writes `data-theme="ds1"` (or 2 or 3) to the `<html>` element and persists the choice in `localStorage` under `narraitor-theme`. Light/dark is layered on top via a separate `dark` class on the same element, and resolves system preference when set to `"system"`.

The tokens themselves are scoped via `[data-theme="ds1"] { ... }` selectors. There's no per-component `theme === 'ds1'` branching in JSX. The components stay theme-blind; the variation lives in CSS variables that resolve differently depending on which theme is active.

The visual canon for each theme is the matching showcase page:

- [src/app/dev/design-system/page.tsx](../../src/app/dev/design-system/page.tsx) (DS1)
- [src/app/dev/design-system-2/page.tsx](../../src/app/dev/design-system-2/page.tsx) (DS2)
- [src/app/dev/design-system-3/page.tsx](../../src/app/dev/design-system-3/page.tsx) (DS3)

Each also has a `/session/` subroute that's the canon for game-session UI specifically. **Storybook** sits one level below the showcase as a component-level reference — `00-Foundation/Design System Showcase` and `00-Foundation/Design Tokens` are the foundation stories, and the toolbar switcher in [.storybook/preview.tsx](../../.storybook/preview.tsx) lets you verify any story in DS1/DS2/DS3 and light/dark. Storybook should match the showcase; if they disagree, the showcase is right.

The canon order is **showcase pages > Storybook > app**. These aren't documentation — they're the source of truth. If a production component drifts from them, the production component is wrong.

## Why This Made Sense

The principle that drove this is structural differentiation: themes have to differ in layout, spacing, shape, and density — not just color and font. Token-only differentiation looks like the same app wearing three hats. Each theme needs a coherent point of view about how interfaces should feel.

You can see this in the radius tokens alone. DS1 ships `--radius-md: 4px` because the Drafting Table aesthetic is about precision and sharp edges — soft corners would fight that. DS2 ships `12px` because Warm Earth is about organic forms; sharp corners would feel wrong. DS3 ships `6px` as a middle position that fits the drafted-ink-on-aged-paper feel. None of those numbers are arbitrary, and none of them would matter if all three themes used the same shape language.

The `data-theme` attribute approach won out because it's cheap, it's reversible, and it doesn't require components to know anything about themes. A button is a button; the theme decides what color it is, what radius, what font weight on hover. The component author writes one component, and three theme files fight it out at the CSS layer.

### What Else We Considered

- **Single theme with genre-driven overrides**. The original instinct: one design system, but worlds get to override colors and fonts based on genre. We tried this in prototypes. Result: every world looked like the same app with a different filter. The structural sameness drowned out the surface variation.
- **shadcn defaults plus token swaps**. Closest to what we already had — keep shadcn shape language, swap palettes per theme. Same problem as above plus the extra constraint that shadcn's shape vocabulary is a single point of view, not three.
- **Per-component theme variants in JSX**. Have components branch on theme: `{theme === 'ds2' ? <DS2Card /> : <DS1Card />}`. Rejected because it puts theme awareness in every component and triples the surface area for any change. The CSS-variable approach gives the same result without the branching.
- **Single theme, mobile-first refresh only**. Defer multi-theme until later, just clean up the existing design. Rejected because the structural-sameness problem was visible enough that the refresh would have to redo most of this work anyway.

## What This Means Going Forward

### Upsides

- Themes are visually canonical. The showcase pages aren't an aspiration; they're the spec. Drift is detectable.
- Switching themes is a one-attribute change. No component refactor, no JSX branching, no per-component story matrix.
- Structural differentiation forces honest design choices. You can't ship "DS2 but with DS1's spacing" without breaking the visual identity of DS2, which is a feature.
- Adding a fourth theme later means adding a fourth CSS file and a fourth showcase page. No existing component changes.

### Downsides

- Three themes means three times the QA surface for anything visual. A change that looks fine in DS1 might break DS3's rhythm in ways that aren't obvious until you flip the toggle.
- Visual regression coverage is still being stabilized — see [#1198](https://github.com/jerseycheese/Narraitor/issues/1198) for the open work on stabilizing tour and world-detail specs across themes.
- Mobile track shipped separately and is still open: [#1139](https://github.com/jerseycheese/Narraitor/issues/1139), [#1143](https://github.com/jerseycheese/Narraitor/issues/1143), [#1148](https://github.com/jerseycheese/Narraitor/issues/1148), [#1150](https://github.com/jerseycheese/Narraitor/issues/1150). Desktop is canon for now; mobile gets per-theme treatment in a follow-up.
- There's a known token discrepancy ([#1203](https://github.com/jerseycheese/Narraitor/issues/1203)): DS1 ships `--radius-md: 4px` but the older shadcn integration guide documents `--radius: 0.5rem`. Both exist — `--radius` is the shadcn-aligned base, `--radius-md` is the explicit per-theme token. The two are intentionally different but the doc needs reconciling.

## Implementation Notes

**Adding a per-theme variation to a component.** Don't branch in JSX. Add a CSS variable for whatever needs to vary, set the default in the theme files, and let the component consume the variable. If the variation is structural enough that CSS variables can't carry it (e.g., a different layout), it's worth questioning whether the component should be rethought rather than forked.

**Adding a new component.** Build it once against tokens. Add a Storybook story alongside it. Verify in this order before merging: showcase pages (canon) first, then Storybook (each of DS1/DS2/DS3 in light and dark via the toolbar), then a real production route. If a token doesn't exist for what you need, add it to all three theme files with values that fit each theme's voice — don't add it to one and let the others fall back to undefined.

**Adding a fourth theme.** Add `dsN.css`, register it in [src/lib/theme/index.ts](../../src/lib/theme/index.ts) (the `THEMES` array and the `DesignSystem` type), and add a showcase page. ThemeProvider's `readStoredTheme` validation will need the new id added to the `if (stored === 'ds1' || ...)` check.

**Where the theme is applied.** [ThemeProvider](../../src/lib/theme/ThemeProvider.tsx) sets `data-theme` on `<html>` and a `dark` class for color scheme. The FOUC script handles the initial paint before React hydrates so users don't see a flash of the default theme. The `useTheme()` hook gives you `theme`, `colorScheme`, `resolvedColorScheme`, and setters.

**Manuscript-prefix CSS.** Some game-session styles live in [src/styles/manuscript-session.css](../../src/styles/manuscript-session.css) and use `manuscript-*` class names. These resolve their values per-theme via the same CSS variable mechanism — the class names aren't theme-specific, the variables are.

## Related Decisions

- [DESIGN.md](../../DESIGN.md) — AI-readable companion at the repo root: tokens, components, and the do's/don'ts list distilled from this migration
- [Design system overview](../design-system/README.md) — landing page for the design-system docs
- [Architecture Decisions index](architecture-decisions.md) — high-level decision summary, including the older Tailwind/shadcn choices that this ADR builds on
- [Design tokens documentation](../design-system/design-tokens.md) — the three-tier token model that informs how variables are organized within each theme file
- [shadcn integration guide](../design-system/shadcn-integration-guide.md) — the shadcn-aligned token surface; reconcile the radius docs against #1203
- [PR #1081](https://github.com/jerseycheese/Narraitor/pull/1081) — the migration itself
- [Epic #1020](https://github.com/jerseycheese/Narraitor/issues/1020) — phase tracking for the migration
