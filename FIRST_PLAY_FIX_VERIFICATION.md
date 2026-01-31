# First Play Tutorial Fix Verification

**Date**: 2026-01-31
**Issue**: Spotlight misalignment on fixed "Journal" button + Backward auto-scroll glitch.
**Status**: ✅ FIXED

## Summary

The "First Play" tutorial had two issues:
1.  **Spotlight Misalignment**: The spotlight appeared significantly above the floating "Journal" button (fixed position).
2.  **Auto-scroll Glitch**: Navigating backward caused the page to scroll up unnecessarily, potentially hiding elements.

## Fix Implementation

1.  **Spotlight Alignment**:
    *   **Action**: Restored `MANUAL_SCROLL_TOURS` to include `'firstPlay'`.
    *   **Effect**: This sets Joyride's `disableScrolling` prop to `true`. By disabling Joyride's native scroll handling, we prevent it from interfering with the coordinate calculations for the `fixed` position button.
    *   **Correction**: Removed `disableScrollParentFix: true`. It was causing Joyride to incorrectly subtract the scroll position from the fixed element's coordinates.
    *   **Result**: Spotlight now correctly aligns at `top: 903px` for the button at `top: 913px` (perfect 10px padding).

2.  **Backward Scroll Prevention**:
    *   **Action**: Added `data: { autoScroll: 'down' }` to all steps in `firstPlayTour.ts`.
    *   **Effect**: The custom `useTutorialAutoScroll` hook now manages scrolling. It checks the direction of navigation and ONLY scrolls if moving **forward** (step index increases).
    *   **Result**: Navigating backward preserves the user's scroll position, preventing jarring jumps.

3.  **Tooltip Placement**:
    *   **Action**: Set `placement: 'top-end'` for the Journal step.
    *   **Result**: Tooltip appears cleanly above the bottom-right floating button.

## Verification Data

- **Button Position**: `top: 913px` (Viewport)
- **Spotlight Position**: `top: 903px` (Viewport)
- **Difference**: `10px` (Correct padding)
- **Tooltip**: Visible and accessible.

## Recommendation

Merge changes.
