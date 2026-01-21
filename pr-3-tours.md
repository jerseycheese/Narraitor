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
