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

## Manual Testing Steps

Since the `TutorialProvider` is not yet mounted in the app layout, manual testing focuses on verifying the state management infrastructure.

### 1. Verify State Initialization & Persistence
1.  Open the application in a browser.
2.  Open **DevTools** > **Application** > **Local Storage**.
3.  Locate `narraitor-session-store`.
4.  **Verify:** The JSON value should now contain a `tutorialProgress` object with the following structure:
    ```json
    "tutorialProgress": {
      "phases": {
        "intro": { "completed": false, "skipped": false },
        "worldCreation": { "completed": false, "skipped": false, "lastStep": 0 },
        // ... other phases
      },
      "dismissedHints": [],
      "lastActiveStep": null
    }
    ```

### 2. Verify State Updates (Console)
1.  Open **DevTools** > **Console**.
2.  Access the store directly (available in development mode):
    ```javascript
    const store = window.useSessionStore.getState();
    console.log(store.tutorialProgress);
    ```
3.  **Action:** Simulate completing a tutorial phase:
    ```javascript
    store.completeTutorialPhase('intro');
    ```
4.  **Verify:** Check the store again (`store.tutorialProgress`) to confirm `intro.completed` is `true`.
5.  **Persistence:** Reload the page and check `localStorage` or the console again. The `intro.completed` state should persist as `true`.

### 3. Unit Tests
1.  Run the infrastructure test suite:
    ```bash
    npm run test src/state/__tests__/sessionStore.tutorial.test.ts
    npm run test src/components/TutorialProvider/__tests__/TutorialProvider.test.tsx
    ```
2.  **Verify:** All tests pass, confirming the logic for progress tracking and provider context works as expected.