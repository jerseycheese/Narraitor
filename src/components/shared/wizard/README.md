# Shared Wizard Components

A reusable wizard component system for creating multi-step forms with consistent styling and behavior.

## Quick Start

```typescript
import {
  WizardContainer,
  WizardProgress,
  WizardNavigation,
  WizardStep,
  useWizardState
} from '@/components/shared/wizard';

function MyWizard() {
  const wizard = useWizardState({
    initialData: { /* your data */ },
    totalSteps: 3,
    persistKey: 'my-wizard-session',
  });

  return (
    <WizardContainer>
      <WizardProgress 
        currentStep={wizard.currentStep} 
        totalSteps={3} 
      />
      
      <WizardStep title="Step 1">
        {/* Your step content */}
      </WizardStep>

      <WizardNavigation {...wizard} />
    </WizardContainer>
  );
}
```

## Components

### Layout Components
- **WizardContainer** - Main wrapper with consistent styling
- **WizardStep** - Individual step container
- **WizardProgress** - Visual progress indicator
- **WizardNavigation** - Previous/Next/Cancel buttons

### Form Components
- **WizardFormSection** - Form section with heading
- **CollapsibleCard** - Expandable content sections
- **ToggleButton** - Styled toggle switches

### Hooks
- **useWizardState** - Complete state management
- **useWizardValidation** - Step validation logic
- **useWizardAI** - AI suggestion integration

## Features

- 📱 Responsive design
- 💾 Automatic session persistence
- ✅ Built-in validation
- 🎨 Consistent styling via `wizardStyles`
- ♿ Accessible by default
- 🧪 Fully tested

## Examples

See these implementations:
- [WorldCreationWizard](../../WorldCreationWizard/)
- [CharacterCreationWizard](../../CharacterCreationWizard/)

## Documentation

Full documentation: [/docs/components/shared-wizard-system.md](/docs/components/shared-wizard-system.md)