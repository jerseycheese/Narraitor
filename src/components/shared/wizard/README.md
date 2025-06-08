# Shared Wizard Components

A reusable wizard component system for creating multi-step forms with shadcn/ui integration, enhanced accessibility, and consistent styling.

## Quick Start

```typescript
import {
  WizardContainer,
  WizardProgress,
  WizardNavigation,
  WizardStep,
  useWizardState
} from '@/components/shared/wizard';
import {
  WizardForm,
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardFormSection
} from '@/components/shared/wizard/components/WizardFormComponents';

function MyWizard() {
  const wizard = useWizardState({
    initialData: { name: '', description: '' },
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
        <WizardFormSection
          title="Basic Information"
          description="Enter basic details"
        >
          <WizardForm data={wizard.data}>
            <WizardFormField
              name="name"
              label="Name"
              required
              description="Enter a unique name"
            >
              <WizardInput placeholder="Enter name" />
            </WizardFormField>
            
            <WizardFormField
              name="description"
              label="Description"
              description="Provide detailed description"
            >
              <WizardTextarea 
                placeholder="Enter description" 
                rows={4} 
              />
            </WizardFormField>
          </WizardForm>
        </WizardFormSection>
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

### Form Components (shadcn/ui Integration)
- **WizardForm** - React Hook Form provider with shadcn/ui integration
- **WizardFormField** - Accessible form field with automatic ARIA labeling
- **WizardInput** - shadcn/ui Input with wizard styling
- **WizardTextarea** - shadcn/ui Textarea with wizard styling
- **WizardSelect** - Enhanced select with validation support
- **WizardButton** - shadcn/ui Button with wizard variants
- **WizardFormSection** - Form section with heading
- **CollapsibleCard** - Expandable content sections
- **ToggleButton** - Styled toggle switches

### Hooks
- **useWizardState** - Complete state management
- **useWizardValidation** - Step validation logic
- **useWizardAI** - AI suggestion integration

## Features

- 📱 Responsive design with mobile-first approach
- 💾 Automatic session persistence
- ✅ React Hook Form validation integration
- 🎨 shadcn/ui components with consistent wizard styling
- ♿ WCAG 2.1 AA accessibility compliance
  - Proper ARIA labeling and descriptions
  - Keyboard navigation support
  - Screen reader announcements
  - Focus management
  - Required field indicators
- 🧪 Fully tested with comprehensive test coverage
- 🚀 TypeScript support with proper type safety

## Examples

See these implementations:
- [WorldCreationWizard](../../WorldCreationWizard/) - Full wizard with world templates and AI suggestions
- [CharacterCreationWizard](../../CharacterCreationWizard/) - Character creation with attributes and skills
- [Dev Test Harness](/src/app/dev/wizard-forms/) - Interactive testing environment

## Accessibility Features

All form components include:
- **ARIA Labels**: Automatic labeling via FormField integration
- **Error Associations**: aria-describedby connects errors to inputs
- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: Proper announcements for state changes
- **Required Indicators**: Visual and semantic required field marking
- **Touch Targets**: Mobile-friendly 44px minimum touch areas

## Documentation

Full documentation: [/docs/components/shared-wizard-system.md](/docs/components/shared-wizard-system.md)