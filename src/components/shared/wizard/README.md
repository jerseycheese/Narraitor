# Shared Wizard Components

Wizard components were scattered all over the place, each doing things slightly differently. This is the unified wizard system that brings consistency to multi-step forms across the app.

## The Basic Pattern

Here's how you build a wizard with these components. The hook handles all the state management, so you just focus on your content:

```typescript
import {
  WizardContainer,
  WizardProgress,
  WizardNavigation,
  WizardStep,
} from '@/components/shared/wizard';
import { useWizardFlow } from '@/components/shared/wizard/hooks/useWizardFlow';

function MyWizard() {
  const wizard = useWizardFlow({
    initialData: { /* your data */ },
    totalSteps: 3,
    persistKey: 'my-wizard-session', // automatically saves progress
  });

  return (
    <WizardContainer>
      <WizardProgress 
        currentStep={wizard.currentStep} 
        totalSteps={3} 
      />
      
      <WizardStep title="Step 1">
        {/* Your step content goes here */}
      </WizardStep>

      <WizardNavigation {...wizard} />
    </WizardContainer>
  );
}
```

## What's In The Box

### Layout Components
- **WizardContainer** - Main wrapper with consistent styling
- **WizardStep** - Individual step container (handles the step-by-step flow)
- **WizardProgress** - Visual progress indicator (because people like to know where they are)
- **WizardNavigation** - Previous/Next/Cancel buttons with smart enable/disable logic

### Form Components
- **WizardFormSection** - Form section with proper heading hierarchy
- **ToggleButton** - Styled toggle switches

- ### Hooks & Utilities
- **useWizardFlow** - Complete state management with persistence, submit, and cancel (saves you from prop drilling hell). For step state without any of that, there's `useWizardState` in `@/hooks`.
- **Validation helpers** - `createWizardValidator`, `validateFields`, and friends for building per-step rules

## Why Use This Instead of Rolling Your Own

- Responsive design that holds up on mobile
- Automatic session persistence (users can close browser and come back)
- Built-in validation patterns that make sense
- Consistent styling via `wizardStyles` (no more "does this look right?" questions)
- Accessible by default (screen readers, keyboard navigation, etc.)
- Fully tested (because wizards have lots of edge cases)

## Examples

See these implementations:
- [WorldCreationWizard](../../WorldCreationWizard/)
- [CharacterCreationWizard](../../CharacterCreationWizard/)

## Documentation

Full documentation: [shared-wizard-system.md](../../../../public_docs/technical-guides/components/shared-wizard-system.md)
