# GuidedFirstTimeExperience Component

This gets new players from "I have no idea what this app does" to "I'm playing a story" in under 2 minutes. The challenge was making onboarding fast enough that people don't bounce, while still explaining what makes this different from other story apps.

## How It Works

**Just three steps** - Welcome (explains the value), World Concept (describe what you want), World Details (pick a name and theme). That's it.

**Smart defaults everywhere** - Most settings are pre-filled with sensible choices, so you only have to make the decisions that actually matter for your experience.

**Real-time validation** - No surprises at the end. If something's wrong, you know immediately.

**Mobile-first design** - Large touch targets and responsive layout work well on phones and tablets.

**Progress preservation** - Uses localStorage to save your progress, so you can take a break and come back without losing your work.

**Easy escape hatch** - Skip button for people who just want to jump into the full creation process.

## What You Get

**Streamlined experience** - Replaces the generic "Start New Game" button with something that actually helps newcomers understand what they're getting into.

**AI-assisted setup** - Suggestions and smart defaults based on what you're trying to create, rather than overwhelming you with every possible option.

**Immediate validation** - No dead ends or confusing error states. The system guides you toward valid choices.

## Usage

The component automatically shows for first-time users and hides for returning users:

```tsx
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';

// Used in QuickPlay component
export function QuickPlay() {
  const { shouldShowOnboarding } = sessionStore();
  
  if (shouldShowOnboarding()) {
    return <GuidedFirstTimeExperience />;
  }
  
  // ... existing QuickPlay logic
}
```

## How It's Built

**Reuses existing wizard infrastructure** - Built on the shared `useWizardFlow` hook, so it handles step navigation, validation, and persistence automatically.

**Smart user detection** - Hooks into the session store to detect first-time users and track when they've completed onboarding.

**Progressive Tutorial System** - After completing the intro wizard, the `GuidedFirstTimeExperience` seamlessly hands off to the `TutorialProvider`, initiating a contextual tour that guides you through the rest of the world and character creation process. This creates a continuous onboarding journey from first click to first gameplay.

**Simple three-step flow** - Welcome (sets expectations), Concept (captures your idea), Details (finalizes the basics). Then you're off to character creation with your new world ready to go.

## Step Breakdown

**Welcome step** - Explains what makes this app different and what you're about to create. Sets expectations for the experience.

**Concept step** - Single text area where you describe what kind of story world you want. The AI uses this to suggest appropriate themes and settings.

**Details step** - Pick a name for your world and confirm the theme. Most of the complex settings are handled automatically based on your concept.

After completion, you land in character creation with your newly minted world already selected and ready for your first adventure.

## Validation

Each step includes appropriate validation:
- Welcome: No validation (always valid)
- Concept: Requires world description
- Details: Requires world name and theme selection

## Testing

The component includes tests covering:
- Step navigation and progression
- Form validation and error handling
- Mobile responsiveness
- Skip functionality
- Integration with QuickPlay

Test with:
```bash
npm test -- --testPathPattern="GuidedFirstTimeExperience"
```

## Test Harness

Manual testing is available at `/dev/guided-first-time-experience` which provides:
- Reset functionality to test first-time user flow
- State management controls
- Mobile responsiveness testing

## Storybook

Interactive stories are available for development:
```bash
npm run storybook
# Navigate to Components/GuidedFirstTimeExperience
```

## Integration Points

- **QuickPlay**: Shows guided experience for first-time users
- **SessionStore**: Tracks onboarding completion and first-time status
- **WorldStore**: Creates worlds with smart default settings
- **Router**: Navigates to character creation after completion

## Performance

The component uses React performance optimizations:
- `useMemo` for expensive render functions
- `useCallback` for event handlers
- Proper dependency arrays to prevent unnecessary re-renders

## Accessibility

- Proper form labels and ARIA attributes
- Large touch targets for mobile (min-h-12)
- Clear visual feedback for validation errors
- Keyboard navigation support via wizard framework