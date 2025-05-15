# Narraitor Routes

## Available Pages

### Main Application
- `/` - Home page (redirects to /worlds)
- `/worlds` - World list page with "Create World" button
- `/worlds/[id]` - Individual world page (404 until implemented)

### World Creation Wizard Testing
- `/test-harness` - Basic test harness for the World Creation Wizard
- `/wizard-demo` - Demo with debug logging
- `/simple-test` - Simplified implementation with navigation to /worlds
- `/debug-wizard` - Debug page showing default attributes and skills

## World Creation Wizard

The wizard has been fully implemented with:
- 5 steps: Basic Info, Description, Attributes, Skills, Finalize
- 6 default attributes: Strength, Intelligence, Agility, Charisma, Dexterity, Constitution
- 12 default skills with "Learning Curve" instead of "Difficulty"
- Navigation to `/worlds` on completion or cancellation
- State persistence between steps
- Local storage integration for created worlds

## Notes

- The `/worlds` page now exists and displays created worlds
- Created worlds are temporarily stored in localStorage
- The wizard properly navigates to `/worlds` after completion
- All test harnesses are available for different testing scenarios
