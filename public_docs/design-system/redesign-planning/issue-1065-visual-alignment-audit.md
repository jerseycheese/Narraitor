# Issue #1065 Visual Alignment Audit (Comprehensive)

- Issue: [#1065](https://github.com/jerseycheese/Narraitor/issues/1065)
- Branch: `codex/1065-visual-alignment-audit`
- Last updated: 2026-02-18
- Primary evidence:
  - `public_docs/design-system/redesign-planning/issue-1065/metrics.json`
  - `public_docs/design-system/redesign-planning/issue-1065/comparison-report.json`
  - `public_docs/design-system/redesign-planning/issue-1065/screenshots/app/`
  - `public_docs/design-system/redesign-planning/issue-1065/screenshots/prototype/`

## Executive Summary

The previous report was incomplete. This pass audited all captured states and surfaced every major divergence class between app and prototype.

Top findings:

1. Drawer states are the largest app/prototype deltas at every breakpoint (all top-12 mismatch pairs are drawers).
2. Tools panel open parity improved after app-side geometry and content-density fixes; remaining delta is mainly panel vertical offset and desktop panel height.
3. Baseline composition differs across steady/streaming/character states (`.manuscript-main-stage`, `#manuscript-action-rail`, desktop characters rail).
4. App and prototype screenshot dimensions differ in all 30/30 pairs due full-page capture behavior on the docs page, so mismatch ratios include long-page content drift in addition to overlay drift.

## Scope

### Screenshot matrix (light)

- Breakpoints: `375`, `768`, `1280`
- States:
  - `steady`
  - `streaming`
  - `character-panel-open`
  - `tools-panel-open`
  - `drawer-character`
  - `drawer-inventory`
  - `drawer-story-summary`
  - `drawer-choice-history`
  - `drawer-journal`

### Dark parity screenshots

- Breakpoints: `375`, `768`, `1280`
- State: `steady`

### Code/computed-style audit

- Breakpoints: `375`, `768`, `1280`, `1480` (`1480` is metrics-only)
- Includes:
  - `.manuscript-hud-panel`
  - `.manuscript-tools-menu-items`
  - `.manuscript-tools-menu-item`
  - `.manuscript-drawer-panel`
  - `.manuscript-drawer-content`
  - tools panel relationships to header/rail

## Method Notes

- Comparison report covers 30 app/prototype screenshot pairs.
- Screenshot dimensions are mismatched in all pairs (examples):
  - mobile: app `375x1336` vs prototype `387x40521`
  - tablet: app `768x1548` vs prototype `768x32774`
  - desktop: app `1280x1518` vs prototype `1280x30602`
- Because captures are `fullPage: true`, mismatch ratios reflect both overlay differences and long-page content differences.
- Metrics selectors were updated to include prototype DOM fallbacks (`#manuscript-panels-menu`, `#manuscript-drawer-panel`, `#manuscript-drawer-content`) so tools/drawer open states are now measured against visible prototype elements.

## Quantitative Findings

### By state (average mismatch ratio)

| State | Avg mismatch | Max mismatch | Notes |
| --- | --- | --- | --- |
| drawer-character | 0.4193 | 0.4779 | Highest overall |
| drawer-journal | 0.4056 | 0.4531 | High drawer/content drift |
| drawer-story-summary | 0.3962 | 0.4379 | High drawer/content drift |
| drawer-inventory | 0.3952 | 0.4334 | High drawer/content drift |
| drawer-choice-history | 0.3937 | 0.4313 | High drawer/content drift |
| steady (light+dark) | 0.1552 | 0.2895 | Baseline composition drift |
| streaming | 0.1391 | 0.2342 | Includes mobile streaming layout drift |
| tools-panel-open | 0.1291 | 0.2043 | Improved after tools parity pass |
| character-panel-open | 0.1256 | 0.1942 | Panel geometry/content drift |

### By breakpoint (average mismatch ratio)

| Breakpoint | Avg mismatch | Max mismatch |
| --- | --- | --- |
| mobile (375) | 0.3355 | 0.4779 |
| tablet (768) | 0.2497 | 0.4040 |
| desktop (1280) | 0.2291 | 0.3761 |

### Most frequent geometry deltas (`>=8px`)

| Selector | Count | Max delta |
| --- | --- | --- |
| `.manuscript-main-stage` | 30 | 273 |
| `#manuscript-action-rail` | 30 | 18 |
| `.manuscript-drawer-content` | 15 | 736 |
| `.manuscript-characters-rail` | 10 | 80 |
| `.manuscript-hud-panel` | 5 | 349 |
| `.manuscript-tools-menu-items` | 3 | 21 |

## Detailed Delta Inventory

### 1) Baseline composition (steady/streaming/character)

Common structural mismatch at 375/768:

- `.manuscript-main-stage`
  - mobile steady: app `display:flex`, `top:55`, `height:864`; prototype `display:grid`, `top:112`, `height:763`.
  - tablet steady: app `top:62`, `height:556`; prototype `top:118`, `height:463`.
- `#manuscript-action-rail`
  - app is consistently shorter by `12px` (mobile), `16px` (tablet), `18px` (desktop).
- desktop `.manuscript-characters-rail`
  - app `height:87`, `top:767`; prototype `height:149`, `top:687` (up to `80px` geometry delta).

Streaming-specific outlier:

- mobile `.manuscript-main-stage` in streaming state reaches `top:-179` in prototype capture vs `top:55` in app (major drift in this state).

### 2) Character panel open

- mobile/tablet panel width differs:
  - app `.manuscript-hud-panel`: `208x356`
  - prototype `.manuscript-hud-panel`: `288x350`
- desktop panel heights differ strongly:
  - app `192x697`
  - prototype `192x350`

### 3) Tools panel open (explicitly requested scope)

Panel geometry:

- mobile:
  - app `.manuscript-hud-panel`: `288x488`
  - prototype `.manuscript-hud-panel`: `288x469`
- tablet:
  - app `288x488`
  - prototype `288x469`
- desktop:
  - app `192x444`
  - prototype `192x386`

Relationship deltas:

- `toolsPanelTopToHeaderBottom`: app `48` vs prototype `8` (delta `40`) across all audited breakpoints.
- `toolsPanelLeftToRailLeft`: app `13-28` vs prototype `0-15` (delta `13`).
- `toolsPanelWidthToRailWidthDelta`:
  - mobile/tablet app `262` vs prototype `288` (delta `26`)
  - desktop app `26` vs prototype `0` (delta `26`)

Menu container/item deltas:

- mobile/tablet `.manuscript-tools-menu-items`
  - app: `display:block`, `262x437`
  - prototype: `display:block`, `262x419`
- `.manuscript-tools-menu-item`
  - app: `262x36`
  - prototype: `262x32` (mobile/tablet)

Visual content drift (from screenshot review):

- app now mirrors prototype tools-menu control density (character quick action + route/simulation/toggle actions), but spacing/offsets still differ.

### 4) Drawer states (character/inventory/story summary/choice history/journal)

All drawer states remain high-delta due both layout and content-model differences.

Consistent geometry/style mismatches:

- `.manuscript-drawer-panel` display/position mismatch in all drawer captures.
- `.manuscript-drawer-content` is the largest geometric drift driver:
  - mobile deltas: `136` to `540`
  - tablet deltas: `368` to `736`
  - desktop deltas: `368` to `736`
- app drawer content uses scrolling container (`overflow:auto`), prototype drawer content is non-scrolling in measured node (`overflow:visible`).

Representative content mismatches from captures:

- `drawer-character`: app shows production character schema; prototype shows design-system narrative card schema.
- `drawer-inventory`: app capture is empty inventory; prototype has seeded item cards and actions.
- `drawer-*` panels differ in total content length and section structure, amplifying full-page mismatch totals.

### 5) Header/action control set differences

Observed in screenshot comparisons:

- mobile header control composition is different between app and prototype in steady/tools-open captures.
- action rail control composition differs (`Suggested Actions` labeling/count presentation and end controls).

## Fixes Applied In This Branch

| Delta id | Area | File(s) changed | Result |
| --- | --- | --- | --- |
| delta-001 | Mobile HUD overlap | `src/app/globals.css`, `src/components/GameSession/ActiveGameSession.tsx` | Removed save-indicator collision that could mask left controls on mobile. |
| delta-002 | Tools panel orchestration | `tests/visual/utils/manuscript-audit-helpers.ts` | Deterministic `openToolsPanel()` for app/prototype capture flow. |
| delta-003 | Audit runtime stability | `tests/visual/utils/wait-helpers.ts` | Replaced broad loading-text waits with scoped loading indicator checks. |
| delta-004 | Layout snapshot selector coverage | `tests/visual/manuscript-layout.spec.ts`, `tests/visual/utils/manuscript-audit-helpers.ts` | Updated panel selectors and added prototype fallback selectors for tool/drawer metrics. |
| delta-005 | Tools geometry/content density parity | `src/app/globals.css`, `src/components/GameSession/ManuscriptDrawerPanels.tsx`, `src/components/GameSession/ActiveGameSession.tsx`, `src/components/GameSession/ManuscriptSessionShell.tsx` | Matched mobile/tablet tools panel width to `288px`, expanded tools control set, switched tools list layout to block flow, and removed forced desktop tools panel height. |

## Verification Gates

- [x] `npm run audit:manuscript:1065`
- [x] `npm run test:visual -- tests/visual/manuscript-breakpoints.spec.ts`
- [x] `npm run test:visual -- tests/visual/manuscript-layout.spec.ts`
- [x] `npm run lint`
- [x] `npm run lint:css`
- [x] `npm run type-check`

## Remaining Parity Work (Not Yet Fixed)

1. Align baseline main-stage/action-rail composition (mobile/tablet first).
2. Align tools panel vertical offset (`topToHeaderBottom` delta remains `40px`).
3. Decide target behavior for remaining desktop tools panel height delta (`444` app vs `386` prototype).
4. Align drawer shell + content model expectations (layout-only parity is blocked by content schema differences without shared fixtures).
5. If strict pixel parity is required, move screenshot comparison to viewport-only captures or crop-normalized analysis to remove long-page noise from docs full-page screenshots.
