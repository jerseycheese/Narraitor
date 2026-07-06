---
title: Shared Wizard System
tags: [wizard, components, reusable]
created: 2025-05-24
updated: 2025-06-08
---

# Shared Wizard System

Reusable multi-step wizard components with consistent styling and behavior. Extracted from WorldCreationWizard for use across the application.

## Core Components

### WizardContainer
Main wrapper providing layout structure.

```typescript
interface WizardContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

Provides consistent max-width, spacing, and background styling.

### WizardProgress
Visual progress indicator.

```typescript
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}
```

Shows step numbers, labels, and highlights completed/current steps.

### WizardNavigation
Step navigation controls.

```typescript
interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onCancel: () => void;
  canProceed?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
  isSubmitting?: boolean;
}
```

Handles Previous/Next/Cancel buttons with validation states and loading indicators.

### WizardStep
Individual step container.

```typescript
interface WizardStepProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}
```

Provides consistent step header and content area styling.

## Form Components

### WizardFormSection
Form section wrapper with optional title and description.

### ToggleButton
Boolean toggle switch component.

```typescript
interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}
```

## Hooks & Utilities

### useWizardState
Primary state management hook.

```typescript
interface UseWizardStateOptions<T> {
  initialData: T;
  totalSteps: number;
  persistKey?: string;
  onComplete?: (data: T) => void | Promise<void>;
  validation?: ValidationRules<T>;
}
```

**Features:**
- Step navigation with bounds checking
- Data persistence to localStorage
- Optional per-step validation via `validation` config
- Async completion handling

### Validation helpers
Located in `utils/validation.ts`:
- `createWizardValidator` – composable builder for per-step validation rules
- `validateFields` / `validateField` – reusable field validation helpers

## Styling System

Centralized styling in `wizardStyles.ts`:

```typescript
// Semantic class hooks only — no Tailwind. The visual rules live in the
// design-system CSS, so theming happens there, not here.
export const wizardStyles = {
  container: "wizard-container",
  header: "wizard-header",
  title: "wizard-title",
  step: { title: "wizard-step-title", description: "wizard-step-description", content: "wizard-step-content" },
  form: { group: "form-group", label: "form-label", input: "form-input", error: "form-error" },
  card: { base: "wizard-card", selected: "wizard-card-selected", unselected: "wizard-card-unselected" },
  // ...navigation, progress, badge, and toggle groups follow the same semantic pattern
};
```

Benefits: Single source of truth, consistent styling, easy theme updates.

## Usage Example

```typescript
import {
  WizardContainer,
  WizardProgress,
  WizardNavigation,
  WizardStep,
  useWizardState,
} from '@/components/shared/wizard';

function MyWizard() {
  const {
    data,
    currentStep,
    updateData,
    nextStep,
    previousStep,
    canProceed,
    isSubmitting,
  } = useWizardState({
    initialData: { name: '', email: '' },
    totalSteps: 3,
    persistKey: 'my-wizard',
    onComplete: async (data) => {
      // Save data
    },
  });

  return (
    <WizardContainer>
      <WizardProgress currentStep={currentStep} totalSteps={3} />
      
      <WizardStep title="Step Title">
        {/* Step content */}
      </WizardStep>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={3}
        onNext={nextStep}
        onPrevious={previousStep}
        onCancel={() => router.push('/')}
        canProceed={canProceed}
        isSubmitting={isSubmitting}
      />
    </WizardContainer>
  );
}
```

## Best Practices

### State Management
- Use `useWizardState` for all wizard state
- Enable persistence for better UX
- Implement proper validation rules per step

### Styling
- Always use `wizardStyles` for consistency
- Extend through className props when needed
- Avoid inline styles

### Accessibility
- All form inputs must have labels
- Associate error messages with inputs
- Ensure keyboard navigation support

## Testing

Test coverage includes:
- Unit tests for each component
- Integration tests for hooks
- Storybook stories for visual testing

```bash
# Run tests
npm test src/components/shared/wizard

# View in Storybook
npm run storybook
# Navigate to Shared/Wizard section
```

## Migration Guide

To migrate existing wizards:

1. Replace custom container with `WizardContainer`
2. Replace progress indicators with `WizardProgress`
3. Replace navigation with `WizardNavigation`
4. Update styling to use `wizardStyles`
5. Migrate state to `useWizardState`

See CharacterCreationWizard migration as reference example.
