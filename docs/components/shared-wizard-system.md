---
title: "Shared Wizard Component System"
type: architecture
category: components
tags: [wizard, components, shared, reusable]
created: 2025-05-24
updated: 2025-06-08
---

# Shared Wizard Component System

## Overview

The shared wizard system provides a reusable set of components for creating multi-step wizards with consistent styling and behavior across the application. It was extracted from the WorldCreationWizard to enable reuse in the CharacterCreationWizard and future wizard implementations.

## Architecture

### Core Components

#### WizardContainer
The main wrapper component that provides the wizard layout structure.

```typescript
interface WizardContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

- Provides consistent max-width and spacing
- Centers content with responsive padding
- Applies background styling

#### WizardProgress
Visual progress indicator showing current step and total steps.

```typescript
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}
```

- Shows step numbers and optional labels
- Highlights completed and current steps
- Provides visual feedback for navigation

#### WizardNavigation
Navigation controls for moving between wizard steps.

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

- Previous/Next/Cancel buttons
- Disables navigation based on validation state
- Shows loading state during submission
- Customizable button labels

#### WizardStep
Individual step container with consistent styling.

```typescript
interface WizardStepProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}
```

- Provides step header with title and description
- Consistent spacing and typography
- Flexible content area

### Form Components

#### WizardFormSection
Consistent form section wrapper with heading support.

```typescript
interface WizardFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
```

#### CollapsibleCard
Expandable/collapsible card for organizing content.

```typescript
interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}
```

#### ToggleButton
Toggle switch component for boolean options.

```typescript
interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}
```

### Hooks

#### useWizardState
State management hook for wizard data and navigation.

```typescript
interface UseWizardStateOptions<T> {
  initialData: T;
  totalSteps: number;
  persistKey?: string;
  onComplete?: (data: T) => void | Promise<void>;
  validation?: ValidationRules<T>;
}
```

Features:
- Step navigation with bounds checking
- Data persistence to sessionStorage
- Validation integration
- Async completion handling

#### useWizardValidation
Validation logic for wizard steps.

```typescript
interface UseWizardValidationOptions<T> {
  data: T;
  rules: ValidationRules<T>;
  currentStep: number;
}
```

#### useWizardAI
AI integration for generating suggestions.

```typescript
interface UseWizardAIOptions {
  worldAnalyzer?: any;
  debounceMs?: number;
}
```

## Styling System

All wizard components use a centralized styling system defined in `wizardStyles.ts`:

```typescript
export const wizardStyles = {
  container: "max-w-2xl mx-auto p-6",
  card: {
    base: "bg-white rounded-lg shadow-md p-6 mb-6",
    hover: "hover:shadow-lg transition-shadow",
  },
  form: {
    label: "block text-sm font-medium text-gray-700 mb-2",
    input: "w-full px-3 py-2 border border-gray-300 rounded-md...",
    error: "mt-1 text-sm text-red-600",
  },
  // ... more styles
};
```

Benefits:
- Single source of truth for styling
- Consistent look across all wizards
- Easy theme updates
- Type-safe style references

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
    complete,
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

1. **State Management**
   - Use `useWizardState` for all wizard state
   - Enable persistence for better UX
   - Implement proper validation rules

2. **Styling**
   - Always use `wizardStyles` for consistency
   - Extend styles through className props when needed
   - Avoid inline styles

3. **Validation**
   - Define validation rules per step
   - Show errors inline with form fields
   - Prevent navigation when invalid

4. **Accessibility**
   - All form inputs must have labels
   - Error messages must be associated with inputs
   - Navigation must be keyboard accessible

## Testing

The shared wizard components include comprehensive test coverage:

- Unit tests for each component
- Integration tests for hooks
- Storybook stories for visual testing

Run tests:
```bash
npm test src/components/shared/wizard
```

View in Storybook:
```bash
npm run storybook
# Navigate to Shared/Wizard section
```

## Migration Guide

To migrate an existing wizard to use shared components:

1. Replace custom container with `WizardContainer`
2. Replace progress indicators with `WizardProgress`
3. Replace navigation buttons with `WizardNavigation`
4. Update styling to use `wizardStyles`
5. Migrate state management to `useWizardState`

See the CharacterCreationWizard migration as an example.