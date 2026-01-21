Title: Implement guided onboarding tours for new users

## Description
This is the main content for the onboarding system. It implements the guided tours for World Creation, Character Creation, and the First Play experience.

I've also added the "Help" menu in the navigation so users can track their progress or restart a tutorial if they get stuck.

**Dependency Note:** This PR requires the `dataTutorial` props from the layout fix PR and the infrastructure from the provider PR to function correctly.

## Related Issue
Closes #399

## Implementation Notes
- World creation tour covers the full flow from template to finalization.
- Added `TutorialMenu` component to the top nav.
- First-time users are automatically detected and prompted to start.

## Testing Steps

### 1. Fresh Start & Onboarding
1.  Clear your browser storage (Application > Local Storage & IndexedDB) or use an Incognito window.
2.  Load the application.
3.  Verify you see the **First-Time User Dashboard** with the "Start New Game" CTA.
4.  Verify the "Tutorial Progress" widget appears in the bottom-left corner (0/4 completed).

### 2. World Creation Tour
1.  Click "Start New Game" or navigate to `/worlds`.
2.  Click "Create New World".
3.  **Tour Start:** Confirm the "World Creation" tour begins automatically on the Template selection screen.
4.  Follow the tour steps. Verify the tour advances correctly as you navigate the wizard steps (Basic Info -> Description -> Attributes -> Skills -> Finalize).
5.  **Synchronization:** Try navigating manually via the wizard tabs/buttons; the tour should sync or pause/resume appropriately.
6.  Complete the world creation. Verify the `TutorialProgressWidget` updates.

### 3. Character Creation Tour
1.  After creating a world, proceed to "Create Custom Character" (or from the dashboard).
2.  **Tour Start:** Confirm the "Character Creation" tour begins on the Template selection step.
3.  Follow the steps through Attributes, Skills, Background, and Portrait.
4.  Create the character. Verify the progress widget updates.

### 4. First Play Tour
1.  Start the game session with your new character.
2.  **Tour Start:** Confirm the "First Session" tour highlights the Narrative column, Choices area, Character Summary, and Inventory.
3.  Verify the tour explains the key game elements correctly.
4.  Complete the tour.

### 5. Persistence & Resumption
1.  Reload the page in the middle of a tour.
2.  Verify the tour resumes from the correct step (or the nearest valid step).
3.  Click the "Tutorial Progress" widget to expand it and see the checklist of completed phases.

### 6. Skipping
1.  Start a tour (e.g., create another world).
2.  Click "Skip" in the Joyride popup.
3.  Verify the tour stops and the progress widget marks that phase as skipped/completed.