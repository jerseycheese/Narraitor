---
title: "ADR-012: Storybook is the single canon frontend surface"
tags: [architecture, decision, adr, design-system, storybook, theming]
created: 2026-06-28
updated: 2026-06-28
---

# ADR-012: Storybook is the single canon frontend surface

**Status**: Accepted - Implemented

**Date**: 2026-06-28

Supersedes the canon-surface decision in [ADR-011](ADR-011-three-design-systems.md) ("canon order: showcase pages > Storybook > app") and reverses [#1276](https://github.com/jerseycheese/Narraitor/issues/1276) ("the living style guide is canon"). The three-design-system architecture from ADR-011 stands unchanged — only *which surface is the source of truth* changes here.

## The Situation

For a while we had two overlapping "canon" surfaces and they kept drifting apart.

The living style guide (`/dev/design-system{,-2,-3}`) was the one we'd invested in: #1276 made it render the real production components themed across DS1/DS2/DS3, with a guard (`verify-ds-canon.cjs`) to keep it honest. But it only ever covered ~15 `ui/*` primitives plus a couple of session/overlay compositions. The guard only enforced coverage for flat `src/components/ui/*.tsx`. So most of the frontend — nested `ui/` components, the whole `shared/` presentational layer, every domain card and portrait and display — could change with nothing watching it.

Meanwhile Storybook had quietly grown to ~100 components across 118 stories, atoms through whole pages, including real full-page stories seeded with mock data. It was the more complete surface, but it was treated as second-class — "Storybook should match the showcase; if they disagree, the showcase is right" (ADR-011). That ordering had it backwards by the time we looked at the actual coverage.

Keeping both meant maintaining two catalogs of the same components and reconciling them by hand. The thing we actually wanted was one place to see pretty much all the frontend — components, bigger compositions, whole pages — rendered with mock data, decoupled from backend/AI/stores/routing, that can't silently go stale.

## What We Decided

Storybook is the single canon surface. The living style guide retires.

Three pieces of work got us there (epic [#1484](https://github.com/jerseycheese/Narraitor/issues/1484)):

1. **Backend-free infra** ([#1485](https://github.com/jerseycheese/Narraitor/issues/1485)) — MSW intercepts the app's AI/HTTP routes so page and organism stories render without a network or a provider key; a `withStores` decorator generalizes store seeding into one call; a viewport toolbar covers mobile/tablet/desktop. Theming (DS1/2/3 + light/dark) already worked in `.storybook/preview.tsx` and was left alone.
2. **A broadened guard** ([#1486](https://github.com/jerseycheese/Narraitor/issues/1486)) — `verify-ds-canon.cjs` now enforces Storybook story coverage across the full in-scope set: nested `ui/**`, the whole `shared/**` presentational layer, and an explicit domain allowlist of presentational cards/portraits/displays. 73 components checked instead of 16. It fails on any new in-scope component that lands without a story.
3. **Backfill + retirement** ([#1487](https://github.com/jerseycheese/Narraitor/issues/1487), [#1488](https://github.com/jerseycheese/Narraitor/issues/1488)) — stories for every grandfathered gap, then deletion of `src/app/dev/design-system{,-2,-3}`, the guide's visual specs, and the guard's guide-specific checks.

Anti-staleness is a structural guard only — every in-scope component must have a story or be explicitly excepted with a reason. No visual-regression baselines for the catalog, no component registry. The `@chromatic-com/storybook` package stays installed but unwired; it's a future option, not a commitment.

Scope is deliberate: UI primitives, `shared/*` presentational components, and *presentational* domain components are standalone catalog entries. The ~280 store/AI/route-wired components appear only inside whole-*page* stories seeded with mock data, never as standalone entries. The guard's `coverageExceptions` list makes that boundary explicit and reviewable.

## Why This Made Sense

The old ordering optimized for a surface that didn't cover the frontend. The guard could pass while most components drifted, because the guard only looked at flat `ui/*`. A canon surface you can't trust to be complete isn't canon — it's a partial demo that happens to be labelled "source of truth."

Storybook was already the broader, more honest surface. Making it canon is mostly admitting where the coverage already was, then putting a guard behind it so the coverage can't quietly regress. One catalog instead of two means no hand-reconciliation, and the backend-free infra means a story is genuinely decoupled — you can open any page in any theme at any breakpoint without standing up the app.

### What Else We Considered

- **Keep both, broaden the guide.** Rejected — it doubles the maintenance and keeps the hand-built showcase pages around as a parallel catalog. The showcase was always going to lag the real component set.
- **Visual-regression baselines for the catalog.** Rejected for this epic. Chromatic-style snapshots are real coverage but real flake and real cost; the structural guard (every component has a story) gets most of the anti-staleness value at a fraction of the maintenance. Left as a future option.
- **A component registry.** Rejected as over-engineering — the baseline-with-reasons pattern already in `verify-ds-canon.cjs` (mirroring `.skott-baseline.json`) does the job without a new format.

## What This Means Going Forward

### Upsides

- One canonical, backend-free view of the frontend.
- New in-scope components can't land without a story — CI fails them.
- No two-catalog reconciliation.
- Pages render decoupled from AI/HTTP/stores/routing, in any theme and viewport.

### Downsides

- The catalog has no pixel-level regression check; a visual regression inside an existing story won't fail CI (structural coverage only). Mitigated by the production visual suite (`session-themes.spec.ts` and friends) on the real routes.
- The explicit domain allowlist is a judgment call — classifying a domain component as "presentational" is a human decision, kept honest by the allowlist being explicit and reviewable rather than guessed by path.

## Implementation Notes

- The guide retirement deletes `src/app/dev/design-system{,-2,-3}`, the `game-session-compare` devtool (it iframed the now-deleted session routes), the `tests/visual/design-system-*.spec.ts` specs, and the `next.config.ts` redirects into the old routes.
- `verify-ds-canon.cjs` keeps only the Storybook-coverage check; the skinning and guide-coverage checks are gone with the guide.
- The DS1/DS2/DS3 token architecture, `data-theme` switching, and structural-differentiation principle from ADR-011 are unchanged. Verify a component in three themes via the Storybook toolbar, not the showcase.

## Related Decisions

- [ADR-011](ADR-011-three-design-systems.md) — three structurally-differentiated design systems (still in force; this ADR only supersedes its canon-surface ordering).
- [#1276](https://github.com/jerseycheese/Narraitor/issues/1276) — the original "living style guide is canon" epic, reversed here.
- [#1484](https://github.com/jerseycheese/Narraitor/issues/1484) — the Storybook-as-canon epic that implemented this.
