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
Individual step container. Note the name collision: this component is unrelated to the
`WizardStep` *type* (`{ id, label, isOptional? }`) that the state hooks take as their `steps` array.

```typescript
interface WizardStepProps {
  children: React.ReactNode;
  error?: string | null;
  className?: string;
}
```

It's a content wrapper with error display. It doesn't render a header, so put your own heading in
`children` if you want one.

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
There are two of these, and neither is re-exported from `@/components/shared/wizard`. Import from
the specific path.

**`@/hooks/useWizardState`** is the one most wizards use (world creation, character creation):

```typescript
interface UseWizardStateOptions<TData> {
  initialData: TData;
  initialStep?: number;
  steps: WizardStep[];                       // an array of step configs, not a count
  onStepValidation?: (stepIndex: number, data: TData) => WizardValidation;
  validateOnUpdate?: boolean;
  onDataChange?: (data: TData) => void;
}

// returns
{ state, currentStepConfig, canGoNext, canGoBack, isFirstStep, isLastStep,
  goNext, goBack, goToStep, updateData, setValidation, setProcessing, setError }
```

Note `state.data` rather than a top-level `data`, and `goNext`/`goBack` rather than
`nextStep`/`previousStep`.

**`@/components/shared/wizard/hooks/useWizardState`** is the router-aware variant, currently used
by `ProviderWizard`. It adds localStorage persistence and a completion callback:

```typescript
interface WizardConfig<T> {
  steps: WizardStep[];
  initialData: T;
  onComplete: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  validateStep?: (step: number, data: T) => ValidationState;
  persistKey?: string;
  debug?: boolean;
}

// returns
{ state, handlers, currentStep, isFirstStep, isLastStep, stepValidation, currentError }
```

Its actions live under `handlers` (`handleNext`, `handleBack`, `handleCancel`, `handleComplete`,
`updateData`, `setError`, `clearError`) rather than at the top level.

Two hooks with one name is a wart worth collapsing at some point; until then, check which one a
component imports before copying its usage.

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
} from '@/components/shared/wizard';
import { useWizardState } from '@/hooks/useWizardState';

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

function MyWizard() {
  const {
    state,
    currentStepConfig,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    updateData,
  } = useWizardState({
    initialData: { name: '', email: '' },
    steps: STEPS,
  });
  const currentStep = state.currentStep;

  return (
    <WizardContainer>
      <WizardProgress steps={STEPS} currentStep={currentStep} />

      <WizardStep>
        <h2>{currentStepConfig.label}</h2>
        {/* Step content */}
      </WizardStep>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onNext={goNext}
        onBack={canGoBack ? goBack : undefined}
        onCancel={() => router.push('/')}
        disabled={!canGoNext}
      />
    </WizardContainer>
  );
}
```

## Best Practices

### State Management
- Use `useWizardState` for wizard state, but check which of the two you want first
- Enable persistence (the `shared/wizard` variant's `persistKey`) when losing progress would hurt
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
