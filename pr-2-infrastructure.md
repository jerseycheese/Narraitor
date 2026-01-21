Title: Add core tutorial system and state management

## Description
Before we can run any tours, we need the plumbing to handle state and persistence. This sets up the `TutorialProvider` context, adds progress tracking to the `sessionStore`, and creates the reusable tooltip components we'll use across the app.

No actual tours are live in this PR yet—it's just the engine that powers them.

## Related Issue
Part of #399

## Implementation Notes
- Uses `react-joyride` for the tour UI mechanics.
- Tutorial progress persists to IndexedDB via our existing Zustand middleware.
- `TutorialProvider` is set up to wrap the app layout (enabled in the next PR).
