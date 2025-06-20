# GuidedFirstTimeExperience Component

A streamlined onboarding flow that guides new players through creating their first world in under 2 minutes.

## Overview

The `GuidedFirstTimeExperience` component provides a 3-step wizard interface specifically designed for first-time users to quickly create their first world and start playing. It replaces the generic "Start New Game" button for new users with a guided experience that includes smart defaults and AI suggestions.

## Features

- **3-Step Process**: Welcome → World Concept → World Details
- **Smart Defaults**: Pre-filled settings to minimize required input
- **Validation**: Real-time validation using shared wizard utilities
- **Mobile Optimized**: Large touch targets and responsive design
- **Persistent State**: Uses localStorage to preserve progress
- **Skip Option**: Allows users to bypass onboarding if desired
- **Integration**: Seamlessly integrates with existing wizard framework

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

## State Management

The component uses the existing `useWizardState` hook for:
- Step navigation and validation
- Form data persistence (`narraitor-onboarding` localStorage key)
- Error handling and loading states

It also integrates with `sessionStore` for:
- First-time user detection (`isFirstTimeUser()`)
- Onboarding completion tracking (`setOnboardingCompleted()`)

## Step Flow

1. **Welcome Step**: Displays value proposition and sets expectations
2. **Concept Step**: Collects world description with AI suggestions
3. **Details Step**: Gathers world name and theme selection

After completion, users are navigated to character creation with their newly created world selected.

## Validation

Each step includes appropriate validation:
- Welcome: No validation (always valid)
- Concept: Requires world description
- Details: Requires world name and theme selection

## Testing

The component includes comprehensive tests covering:
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