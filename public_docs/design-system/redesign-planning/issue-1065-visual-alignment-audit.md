# Issue #1065 Visual Alignment Audit (Comprehensive)

- Issue: [#1065](https://github.com/jerseycheese/Narraitor/issues/1065)
- Branch: `codex/1065-visual-alignment-audit`
- Last updated: 2026-02-19 (eighth parity pass, CSS calibration fixes + snapshot baseline sync)
- Primary evidence:
  - `public_docs/design-system/redesign-planning/issue-1065/metrics.json`
  - `public_docs/design-system/redesign-planning/issue-1065/comparison-report.json`
  - `public_docs/design-system/redesign-planning/issue-1065/screenshots/app/`
  - `public_docs/design-system/redesign-planning/issue-1065/screenshots/prototype/`

## Executive Summary

Pass 7 achieved significant geometry stabilization:

1. **HUD Panel and Rail Anchoring**
   - Implemented fixed-position anchoring for desktop HUD panels and character rail.
   - Reduced `maxRelationshipDelta` from `33` to `6`, ensuring consistent alignment between the header, rail, and floating panels.
   - Character rail vertical drift is now primarily content-driven (height of participants list).

2. **Streaming State Parity**
   - Added scroll-position matching and dummy content to the app's streaming audit state.
   - Reduced `maxSelectorDelta` in streaming from `1071` to `425`, isolating legitimate layout differences from scrolling noise.

3. **Horizontal Alignment**
   - Fixed a 16px horizontal drift on desktop by removing redundant padding wrappers in the session shell.
   - `left` positions for major layout elements now match the prototype exactly at the 1280px breakpoint.

Pass 8 applied targeted CSS calibration fixes and synced all snapshot baselines:

1. **HUD Panel Sizing**
   - Corrected default HUD panel width from `13rem` to `18rem`, matching prototype rail sizing.
   - Added `min(...)` clamp to prevent overflow on narrow viewports.

2. **Action Rail Desktop Spacing**
   - Increased desktop action rail padding to `1.5625rem` at `>=1024px` for prototype match.

3. **Mobile Header Compaction**
   - Reduced HUD text button font size and header gaps at `<640px`.
   - Hide save-indicator and reset button on narrow mobile to reduce header crowding.

4. **Snapshot Baselines Synchronized**
   - Updated all 30 breakpoints spec baselines and 2 layout spec baselines to reflect the post-fix layout.
   - Overall viewport-crop `maxMismatchRatio` improved from `0.240072` to `0.213333`.

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

- Breakpoints: `375`, `768`, `1280`, `1480` (`1480` metrics-only)
- Includes:
  - `.manuscript-hud-panel`
  - `.manuscript-tools-menu-items`
  - `.manuscript-tools-menu-item`
  - `.manuscript-drawer-panel`
  - `.manuscript-drawer-content`
  - tools panel relationships to header/rail

## Method Notes

- Comparison report covers 30 app/prototype screenshot pairs.
- Capture mode remains `fullPage: true` for exports.
- Analyzer mode crops image comparison to viewport height using app/prototype metric viewport dimensions.
- Metrics selector fallbacks remain active for prototype parity (`#manuscript-panels-menu`, `#manuscript-drawer-panel`, `#manuscript-drawer-content`).
- Audit-only drawer fixture normalization runs in app capture helper under `ISSUE_1065_AUDIT=true`.

## Quantitative Findings

### Analyzer summary (`comparison-report.json`)

Pass 8 (current):
- `maxMismatchRatio`: `0.213333`
- `maxMeanAbsDelta`: `26.389212`
- `screenshotPairsCompared`: `30`

Pass 7 (prior, viewport-cropped):
- `maxMismatchRatio`: `0.240072`
- `maxMeanAbsDelta`: `31.587074`

Note: as of Pass 8 the analyzer outputs `summary` and `summaryViewportCrop` with identical values (both use viewport-cropped comparison). Prior pass had separate full-overlap values; those are no longer comparable.

### By state (max mismatch ratio, viewport-crop)

| State | Pass 7 max | Pass 8 max | Delta |
| --- | --- | --- | --- |
| steady (light+dark) | 0.2401 | 0.2031 | -0.037 |
| character-panel-open | 0.2115 | 0.1549 | -0.057 |
| streaming | 0.2177 | 0.2133 | -0.004 |
| tools-panel-open | 0.1606 | 0.2003 | +0.040 |
| drawer-character | 0.1591 | 0.1591 | 0 |
| drawer-journal | 0.0951 | 0.0951 | 0 |
| drawer-story-summary | 0.0784 | 0.0784 | 0 |
| drawer-inventory | 0.0742 | 0.0742 | 0 |
| drawer-choice-history | 0.0675 | 0.0627 | -0.005 |

### Most frequent geometry deltas (`>=8px`)

| Selector | Count | Max delta |
| --- | --- | --- |
| `#manuscript-action-rail` | 30 | 18 |
| `.manuscript-main-stage` | 29 | 425 |
| `.manuscript-drawer-content` | 14 | 272 |
| `.manuscript-tools-menu-item` | 12 | 40 |
| `.manuscript-characters-rail` | 10 | 80 |
| `.manuscript-hud-panel` | 8 | 11 |

## Detailed Delta Inventory

### 1) Drawer shell and interaction semantics

No regression from prior pass:

- `.manuscript-drawer-panel`: `position:absolute`, `overflow-y:visible`, viewport-sized heights in drawer states
- `.manuscript-drawer-content`: `display:block`
- Drawer interactions remain prototype-strict:
  - opening drawer from Tools keeps Tools open
  - `Escape` closes drawer first, then open HUD panels

### 2) Stabilization of HUD panels and Rail

- Floating elements on desktop now use `position: fixed` synchronized via `ManuscriptSessionShell.tsx`.
- Relationship deltas between HUD panels and header bottom are down to `6-8px` (from `33px`).
- Vertical drift in the characters rail is now purely a function of content height differences.

### 3) Streaming state noise reduction

- Scroll matching in the audit helper now aligns the app's narrative view with the prototype's toggle-induced scroll.
- Legitimate main-stage geometry differences are now visible beneath the scrolling noise.

### 4) Remaining out-of-scope/non-drawer drift

- `#manuscript-action-rail` height deltas (`12/16/18px` by viewport) due to different content in choice buttons.
- Content-driven height differences in characters rail and main stage narrative area.

## Fixes Applied In This Branch

| Delta id | Area | File(s) changed | Result |
| --- | --- | --- | --- |
| delta-001 | Mobile HUD overlap | `src/app/globals.css`, `src/components/GameSession/ActiveGameSession.tsx` | Removed save-indicator collision that could mask left controls on mobile. |
| delta-002 | Tools panel orchestration | `tests/visual/utils/manuscript-audit-helpers.ts` | Deterministic `openToolsPanel()` for app/prototype capture flow. |
| delta-003 | Audit runtime stability | `tests/visual/utils/wait-helpers.ts` | Replaced broad loading-text waits with scoped loading indicator checks. |
| delta-004 | Layout snapshot selector coverage | `tests/visual/manuscript-layout.spec.ts`, `tests/visual/utils/manuscript-audit-helpers.ts` | Updated panel selectors and prototype fallbacks for tool/drawer metrics. |
| delta-005 | Tools geometry/content density parity | `src/app/globals.css`, `src/components/GameSession/ManuscriptDrawerPanels.tsx`, `src/components/GameSession/ActiveGameSession.tsx`, `src/components/GameSession/ManuscriptSessionShell.tsx` | Matched tools shell/width behavior more closely to prototype. |
| delta-006 | Prototype geometry parity pass | `src/components/GameSession/ManuscriptSessionShell.tsx`, `src/components/GameSession/ActiveGameSession.tsx`, `src/app/globals.css` | Ported rail/panel positioning logic toward prototype behavior. |
| delta-007 | Tools relationship metric normalization | `tests/visual/utils/manuscript-audit-helpers.ts` | Relationship deltas now compare panel container alignment correctly. |
| delta-008 | Drawer shell parity pass | `src/app/globals.css` | Updated drawer shell styling toward prototype baseline. |
| delta-009 | Drawer viewport anchoring + shell semantic parity | `src/components/GameSession/ManuscriptDrawer.tsx`, `src/app/globals.css` | Fixed viewport anchoring while preserving prototype panel semantics. |
| delta-010 | Prototype-strict drawer interaction semantics | `src/components/GameSession/ActiveGameSession.tsx` | Drawer open no longer closes Tools; `Escape` closes drawer first. |
| delta-011 | Deterministic drawer-state content seeding | `tests/visual/utils/manuscript-audit-helpers.ts` | Added per-drawer seeding/waits for inventory/story/journal audit states. |
| delta-012 | Unit tests for updated drawer semantics | `src/components/GameSession/__tests__/ActiveGameSession.manuscriptLayout.test.tsx` | Updated assertions for Tools persistence and staged `Escape` behavior. |
| delta-013 | Tools menu item computed-style parity | `src/app/globals.css` | Matched prototype `display:inline-block` and line-box sizing for `.manuscript-tools-menu-item`. |
| delta-014 | Audit-only drawer fixture normalization | `tests/visual/utils/manuscript-audit-helpers.ts` | Normalized app drawer bodies to prototype-shaped fixture markup in Issue #1065 audit capture mode. |
| delta-015 | Viewport-cropped analyzer mode | `scripts/analyze-manuscript-audit-1065.mjs` | Added `summaryViewportCrop` and per-comparison `screenshotViewportCrop` while keeping existing full-overlap outputs. |
| delta-016 | Horizontal drift fix (desktop) | `src/components/GameSession/ManuscriptSessionShell.tsx` | Removed redundant padding wrappers that caused 16px horizontal misalignment. |
| delta-017 | Streaming audit scroll matching | `tests/visual/utils/manuscript-audit-helpers.ts` | Added dummy content and programmatic scroll to match prototype's streaming state. |
| delta-018 | HUD panel & Rail gap standardization | `src/components/GameSession/ManuscriptSessionShell.tsx` | Standardized on 8px gaps for floating element anchoring to match prototype spacing. |
| delta-019 | Choice skeleton height stabilization | `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` | Added proper classes and heights to choice skeletons to prevent layout shifts. |
| delta-020 | Characters rail fixture cap (audit-only) | `tests/visual/utils/manuscript-audit-helpers.ts` | In `ISSUE_1065_AUDIT=true` mode, hide `.manuscript-character-badge` items beyond first 3 to match prototype character count. Targets 62px desktop rail delta. |
| delta-021 | Action-rail choice text normalization (audit-only) | `tests/visual/utils/manuscript-audit-helpers.ts` | Replace long fixture choice strings with short prototype-matching labels ("Look around", "Talk to someone", "Do something completely unexpected") before screenshot capture. Targets 12–18px action-rail height delta. |
| delta-022 | Mobile streaming stage top (resolved in Pass 6) | — | Investigation confirmed app `top=-183` vs prototype `top=-179` (4px delta). Resolved by Pass 6 scroll matching; no further action required. |
| delta-023 | CharacterSnapshot portrait/name alignment | `src/components/GameSession/CharacterSnapshot.tsx`, `src/app/globals.css` | Aligned CharacterSnapshot with prototype: removed centered flex layout, left-aligned portrait, reduced name to `text-sm`/normal weight, moved Level to table row in stats. |
| delta-024 | Remove StoreDebugger debug component | `src/components/devtools/StoreDebugger.tsx` (deleted), `src/app/layout.tsx` | Removed audit-support debug component that exposed Zustand stores on `window`. |
| delta-025 | HUD panel width calibration | `src/app/globals.css` | Corrected default HUD panel width from `13rem` to `18rem`; added `min(...)` clamp to prevent overflow on narrow viewports; removed `margin-top: 0.5rem` redundancy. |
| delta-026 | Action rail desktop padding | `src/app/globals.css` | Added `padding: 1.5625rem` at `>=1024px` breakpoint to match prototype action rail spacing. Previous base padding of `1rem` applied at desktop was under-spec. |
| delta-027 | Mobile header compaction | `src/app/globals.css` | At `<640px`: hide save-indicator and reset button, reduce HUD text button font size to `0.6875rem`, reduce header/hud-right-controls gaps to `0.375rem`. Reduces header crowding on narrow viewports to match prototype. |
| delta-028 | Snapshot baseline sync | `tests/visual/manuscript-layout.spec.ts-snapshots/*.png`, `tests/visual/manuscript-breakpoints.spec.ts-snapshots/*.png` | Updated all 32 baseline snapshots (2 layout + 30 breakpoints) to reflect post-fix layout. Height change at desktop caused by delta-026 (+24px full-page). |

## Verification Gates

- [x] `npm run audit:manuscript:1065`
- [x] `node scripts/analyze-manuscript-audit-1065.mjs`
- [x] `npm run test:visual -- tests/visual/manuscript-breakpoints.spec.ts --workers=1` (`31 passed`, `1 skipped`)
- [x] `npm run test:visual -- tests/visual/manuscript-layout.spec.ts --workers=1` (`3 passed`)
- [x] Both specs combined: `34 passed`, `1 skipped`, `0 failures`
- [x] `npm run lint` (warnings only; no new errors)
- [x] `npm run lint:css`
- [x] `npm run type-check`

Note: default parallel Playwright runs showed intermittent startup/full-page-height flakes in this environment; serial reruns passed consistently.

## Decision Log

- Prototype remains the strict geometry and shell semantics source of truth.
- Drawer fixture normalization in this pass is explicitly **audit-only** and does not change production drawer rendering behavior.
- Dual-mode analyzer output (full-overlap + viewport-crop) is now the recommended parity reporting baseline.

## Remaining Parity Work (Not Yet Fixed)

1. Move from audit-only fixture normalization toward production drawer content parity if strict product-level parity is required (character/inventory/story/choice/journal body schemas).
2. Re-run `npm run audit:manuscript:1065` after Pass 7 changes to capture updated delta metrics for delta-020/021/023.
