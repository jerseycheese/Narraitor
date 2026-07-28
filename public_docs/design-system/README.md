---
title: Design System
tags: [design-system, theming, overview]
created: 2026-05-10
updated: 2026-07-11
---

# Design System

> **Note (2026-07-11):** This page still describes the old three-system architecture in places. As of [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md), Narraitor ships a single design system — **DS3** only. The comparison table below is kept as a historical record; treat DS1 and DS2 as gone everywhere they're mentioned.

**DS3** isn't user-selectable, and it isn't tied to a world's genre either — it has its own CSS file and its own visual point of view. Components stay theme-blind.

For the original three-system rationale (superseded), see [ADR-011](../architecture/ADR-011-three-design-systems.md). For the collapse decision, see [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md). For an AI-readable summary of the design surface, see [DESIGN.md](../../DESIGN.md) at the repo root.

## Principles

- **Structural differentiation over token swaps.** Themes vary in shape language, spacing rhythm, and density — not just color and font. Same shape with three palettes reads as one product wearing three hats.
- **Tokens carry the variation; components stay blind.** No `theme === 'ds1'` branching in JSX. Components consume `var(--token-name)` and let the active theme decide the value.
- **Storybook is canon** (ADR-012). The old `/dev/design-system{,-2,-3}` showcase pages this bullet used to point to are retired — `npm run storybook` is the source of truth now. If a production component drifts from Storybook, the production component is wrong.
- **No inline styles.** Every visual value comes from a token. Hardcoded colors and pixel values are bugs.

## The Three Systems

| | Name | Feel | Narrative font | Accent | Radius (md) |
|---|---|---|---|---|---|
| **DS1** | The Drafting Table | Sharp lines, archival ink, graph-paper grid | Lora | Archival Ink Blue | 4px |
| **DS2** | Warm Earth | Organic, soft, breathing space | Crimson Pro | Sage Green | 12px |
| **DS3** | Mechanical Manuscript | Aged paper, drafting ink, dot grid | Newsreader | Steel Blue | 6px |

DS1 was the default until the collapse; DS3 is the only theme running now, hardcoded rather than defaulted. Light + dark mode are still layered on top via a separate `dark` class on `<html>` — unaffected by the collapse.

## Where things live

- **Theme tokens**: [src/lib/theme/themes/ds3.css](../../src/lib/theme/themes/ds3.css) — the only theme file now; `ds1.css` and `ds2.css` are deleted
- **Theme registry & types**: [src/lib/theme/index.ts](../../src/lib/theme/index.ts)
- **Theme provider** (sets `data-theme`, manages dark mode, persists color-scheme choice): [src/lib/theme/ThemeProvider.tsx](../../src/lib/theme/ThemeProvider.tsx)
- **Global element resets / utility CSS**: [src/app/globals.css](../../src/app/globals.css)
- **Game-session-specific styles**: [src/styles/manuscript-session.css](../../src/styles/manuscript-session.css)
- **Storybook**: `npm run storybook` (port 6006) — the canon frontend surface (ADR-012). The foundation story is [src/stories/00-foundation/](../../src/stories/00-foundation/) `DesignSystemShowcase`. The toolbar has a light/dark switcher — verify components in both. The old showcase pages (`/dev/design-system{,-2,-3}`) are retired.

## Documentation in this directory

- **[design-tokens.md](./design-tokens.md)** — full token reference (the three-tier system, color/spacing/typography/elevation tokens, theme-specific values, dark-mode patterns)
- **[global-styles.md](./global-styles.md)** — CSS architecture, load order, the no-inline-styles rule, `useTheme()` API
- **[shadcn-integration-guide.md](./shadcn-integration-guide.md)** — the shadcn/ui foundation (Radix primitives); mostly historical now since Tailwind, `cva`, and `cn()` were removed in the clean-slate migration
- **[icon-usage-guide.md](./icon-usage-guide.md)** — lucide-react conventions, sizing standards

## Adding to the system

- **New token?** Add it to `ds3.css` — both light and dark blocks. Don't add it to only one and let the other fall back to undefined.
- **New component?** Build against tokens, not raw values. Add a Storybook story alongside the component. Verify in Storybook (light × dark), then a real production route, before merging.
- **New per-theme variation on an existing component?** Don't branch in JSX. Add a CSS variable for the property that needs to vary; let each theme set its own value. If the variation is structural enough that a CSS variable can't carry it, rethink the component before forking it.
- **Second theme?** This isn't a simple checklist anymore — [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md) collapsed to one design system deliberately, so going back to multiple means re-introducing what that ADR removed, not just adding a file. The theme axis is gone from [ThemeProvider.tsx](../../src/lib/theme/ThemeProvider.tsx) entirely (#1546 removed `readStoredTheme()`, `DEFAULT_THEME`, and the `theme`/`setTheme` context surface) — there's no persistence, validation, or state left to update; a second theme would need all of it rebuilt. There's no showcase-page pattern to extend either; ADR-012 retired that in favor of Storybook, whose toolbar currently only switches light/dark (see [.storybook/preview.tsx](../../.storybook/preview.tsx)) — a theme selector would need to be added from scratch. Read ADR-013's rationale before reaching for this.

## Verifying visual changes

**Canon order: Storybook > app** (ADR-012). The showcase pages this section used to lead with are retired; Storybook is the highest authority now.

In order:

1. **Storybook** — `npm run storybook`. Component-level reference. Use the toolbar switcher to flip light/dark. If production drifts from Storybook, fix production.
2. **Real production routes** — walk the actual user flow that exercises the change. Token-level fixes can pass Storybook but still break in real flows where data shape, async loading, or layout context shifts behavior.
3. **Visual regression suite** — `npm run test:visual`. See [visual-regression-testing.md](../development/visual-regression-testing.md).
