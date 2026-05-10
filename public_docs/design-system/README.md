---
title: Design System
tags: [design-system, theming, overview]
created: 2026-05-10
updated: 2026-05-10
---

# Design System

Three structurally-different design systems ship with the app — DS1, DS2, DS3. The user picks one in the theme switcher; it isn't tied to a world's genre. Each theme has its own CSS file, its own showcase page, and its own visual point of view. Switching is a one-attribute change on `<html>`. Components stay theme-blind.

For the rationale, see [ADR-011](../architecture/ADR-011-three-design-systems.md). For an AI-readable summary of the design surface, see [DESIGN.md](../../DESIGN.md) at the repo root.

## Principles

- **Structural differentiation over token swaps.** Themes vary in shape language, spacing rhythm, and density — not just color and font. Same shape with three palettes reads as one product wearing three hats.
- **Tokens carry the variation; components stay blind.** No `theme === 'ds1'` branching in JSX. Components consume `var(--token-name)` and let the active theme decide the value.
- **The showcase pages are canon.** [`/dev/design-system`](../../src/app/dev/design-system/page.tsx), [`-2`](../../src/app/dev/design-system-2/page.tsx), and [`-3`](../../src/app/dev/design-system-3/page.tsx) are the source of truth. If a production component drifts from the showcase, the production component is wrong.
- **No inline styles.** Every visual value comes from a token. Hardcoded colors and pixel values are bugs.

## The Three Systems

| | Name | Feel | Narrative font | Accent | Radius (md) |
|---|---|---|---|---|---|
| **DS1** | The Drafting Table | Sharp lines, archival ink, graph-paper grid | Lora | Archival Ink Blue | 4px |
| **DS2** | Warm Earth | Organic, soft, breathing space | Crimson Pro | Sage Green | 12px |
| **DS3** | Mechanical Manuscript | Aged paper, drafting ink, dot grid | Newsreader | Steel Blue | 6px |

DS1 is the default. Light + dark mode are layered on top via a separate `dark` class on `<html>`.

## Where things live

- **Theme tokens**: [src/lib/theme/themes/ds1.css](../../src/lib/theme/themes/ds1.css), [ds2.css](../../src/lib/theme/themes/ds2.css), [ds3.css](../../src/lib/theme/themes/ds3.css)
- **Theme registry & types**: [src/lib/theme/index.ts](../../src/lib/theme/index.ts)
- **Theme provider** (sets `data-theme`, manages dark mode, persists choice): [src/lib/theme/ThemeProvider.tsx](../../src/lib/theme/ThemeProvider.tsx)
- **Global element resets / utility CSS**: [src/app/globals.css](../../src/app/globals.css)
- **Game-session-specific styles**: [src/styles/manuscript-session.css](../../src/styles/manuscript-session.css)
- **Showcase pages**: [src/app/dev/design-system/page.tsx](../../src/app/dev/design-system/page.tsx) (DS1), `-2/page.tsx` (DS2), `-3/page.tsx` (DS3). Each has a `session/page.tsx` subroute that's canon for game-session UI.
- **Storybook**: `npm run storybook` (port 6006). Foundation stories at [src/stories/00-foundation/](../../src/stories/00-foundation/) (`DesignSystemShowcase`, `DesignTokens`). The toolbar has a DS1/DS2/DS3 + light/dark switcher — verify components in all six combinations.

## Documentation in this directory

- **[design-tokens.md](./design-tokens.md)** — full token reference (the three-tier system, color/spacing/typography/elevation tokens, theme-specific values, dark-mode patterns)
- **[global-styles.md](./global-styles.md)** — CSS architecture, load order, the no-inline-styles rule, `useTheme()` API
- **[shadcn-integration-guide.md](./shadcn-integration-guide.md)** — shadcn/ui setup, button/badge variants, the `cn()` utility (note: pre-DS-migration framing for the CSS-variables section)
- **[icon-usage-guide.md](./icon-usage-guide.md)** — lucide-react conventions, sizing standards
- **[redesign-planning/](./redesign-planning/)** — historical migration research and audits, kept for context

## Adding to the system

- **New token?** Add it to all three theme files (`ds1.css`, `ds2.css`, `ds3.css`) — both light and dark blocks. Don't add to one and let the others fall back to undefined.
- **New component?** Build against tokens, not raw values. Add a Storybook story alongside the component. Verify in all three showcase pages and in Storybook (DS1/DS2/DS3 + light/dark) before merging.
- **New per-theme variation on an existing component?** Don't branch in JSX. Add a CSS variable for the property that needs to vary; let each theme set its own value. If the variation is structural enough that a CSS variable can't carry it, rethink the component before forking it.
- **Fourth theme?** Add `dsN.css`, register it in [src/lib/theme/index.ts](../../src/lib/theme/index.ts), add a showcase page, update `ThemeProvider`'s `readStoredTheme` validation, and add the new theme to the Storybook toolbar in [.storybook/preview.tsx](../../.storybook/preview.tsx).

## Verifying visual changes

In order:

1. **Storybook** for the affected component(s). Use the theme switcher to flip DS1/DS2/DS3 and light/dark. Catches token regressions at the component level.
2. **Showcase pages** — `/dev/design-system{,-2,-3}` and the `/session/` subroutes. Catches drift from canon at the page level.
3. **Real production routes** — walk the actual user flow that exercises the change. Token-level fixes can pass Storybook and showcase but still break in real flows where data shape, async loading, or layout context shifts behavior.
4. **Visual regression suite** — `npm run test:visual`. See [visual-regression-testing.md](../development/visual-regression-testing.md). Multi-theme baselines stabilization is tracked in [#1198](https://github.com/jerseycheese/Narraitor/issues/1198).
