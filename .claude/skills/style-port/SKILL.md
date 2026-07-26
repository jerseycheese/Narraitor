---
name: style-port
description: Port inline styles from a reference/demo component to production CSS in the Narraitor design system. Rigid 6-phase process that diffs inline styles against production stylesheets, ports gaps using design tokens, and removes inline styles from production components. Use when porting design system styles from any reference source to the app.
---

# Style Port — Narraitor Design System Porting

Port inline styles from a reference source (demo component, Figma spec, screenshot comparison) to production CSS through a systematic, code-level diff.

## Hard Rules

- **No `!important`** -- fix specificity at the selector level.
- **No raw pixel values** when a design token exists (`--space-*`, `--radius-*`, `--font-*`). Token definitions live in `src/lib/theme/themes/`: spacing and `--radius-full` in `_shared-tokens.css`, `--font-*` and `--radius-sm/md/lg` in `ds3.css`.
- **No demo-only UI** -- do not port components that only exist in the reference scaffold (state switchers, mock data chrome, debug panels).
- **No dark-mode changes** -- theme overrides target `[data-theme="dsN"]` only. Do not touch `.dark` variants unless the plan explicitly calls for it.
- **No new inline styles** -- the point is moving styles into CSS. Never add `style={{}}` to fix a gap.
- **One canon location per surface** -- game-session styles go in `src/styles/manuscript-session.css`. Other surfaces use their own canonical stylesheet. No component-level CSS modules for layout/theme styles.
- **Theme-scoped overrides** -- DS-specific rules use `[data-theme="ds1"]`, `[data-theme="ds2"]`, or `[data-theme="ds3"]` selectors.
- **Merge, don't duplicate** -- if a selector already exists, add properties to the existing block rather than creating a new one. Reference the fix number when extending existing blocks.

## Phase 1: Inventory

Enumerate every inline `style={{...}}` prop in the reference component for the target theme/surface. Output a numbered list:

```
1. Container: { backdropFilter: 'blur(20px)', padding: '10px 10px 6px' }
2. SendButton: { height: 38, padding: '0 14px', fontWeight: 500 }
```

Also note any CSS classes in the reference that don't exist in the production stylesheet.

## Phase 2: Map

For each inventoried style, find the production equivalent:
- Which CSS class targets the same element?
- Which properties are already declared?
- Are there theme-scoped `[data-theme="dsN"]` overrides that partially cover it?

Output a mapping table:

| # | Reference Property | Production Selector | Current Value | Gap? |
|---|-------------------|---------------------|---------------|------|

## Phase 3: Diff

For each gap, determine the exact CSS declaration:
- Convert px to the nearest design token or rem.
- DS-specific rules go under `[data-theme="dsN"]`.
- Base/shared rules go unscoped.
- If an existing block partially covers the fix, merge into it.

Output a numbered fix list with CSS.

## Phase 4: Port

Apply CSS changes to the production stylesheet:
- Add new rules in the correct section (base, then DS1, DS2, DS3 override blocks).
- Merge into existing rule blocks when the selector already exists.
- Keyframes go near other `@keyframes` definitions.
- Maintain section order within the file.

## Phase 5: Clean

Remove inline styles from production React components:
- Delete `style={{...}}` props now covered by CSS.
- Replace conditional style props with class-based targeting (parent class selectors).
- Add any new CSS classes needed to support the class-based approach.

## Phase 6: Verify

- [ ] `npx stylelint` on the modified stylesheet -- clean
- [ ] `npx tsc --noEmit` -- clean (no type errors from removed style props)
- [ ] Relevant Jest tests pass
- [ ] Other themes unaffected (all new DS-specific rules are `[data-theme]` scoped)
- [ ] No `!important` introduced
- [ ] No raw pixel values where tokens exist
- [ ] No remaining inline `style=` props for ported properties
- [ ] **Visual audit with dev-browser** -- render demo markup and production markup side-by-side under the target theme, compare computed styles (height, padding, margin, color, font) to catch inherited-style artifacts that code-level diff misses

## Visual Audit with dev-browser

Code-level diffs catch explicit property gaps but miss inherited-style artifacts (e.g., a wrapper div inheriting a larger line-height, inflating badge height). After porting, use the `dev-browser` skill to:

0. **Float the browser window** -- AeroSpace tiles Chromium by default, constraining the viewport and breaking media query tests. After the dev-browser server starts, run: `aerospace layout floating` (targets the focused window). Verify with `window.innerWidth` in a script before relying on breakpoint-dependent CSS.
1. **Inject both demo and production markup** into the same page under the target `[data-theme]`.
2. **Screenshot side-by-side** for visual comparison.
3. **Extract computed styles** from matching elements and diff key metrics: height, padding, margin, font-size, line-height, color.
4. **Fix discrepancies** found only through computed-style comparison (not visible in source code).

This step catches the class of bugs where CSS inheritance produces different rendered output even when the declared properties appear identical.

## Workflow

- Run per-theme when porting theme-specific styles (DS1 first, then DS2, then DS3).
- Each invocation produces a discrete set of numbered fixes.
- Deferred items (error states, fundamentally different UX patterns, demo-only chrome) are called out but not ported.
