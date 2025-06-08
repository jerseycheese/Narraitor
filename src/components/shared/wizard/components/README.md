# Wizard Form Components (shadcn/ui Integration)

Enhanced form components built on shadcn/ui with React Hook Form integration and comprehensive accessibility features.

## Components Overview

### WizardForm
React Hook Form provider that manages form state and validation.

```typescript
<WizardForm data={formData}>
  {/* Form fields go here */}
</WizardForm>
```

**Props:**
- `data: T` - Form data object
- `children: React.ReactNode` - Form fields
- `defaultValues?: DefaultValues<T>` - Optional default values

### WizardFormField
Accessible form field wrapper with automatic ARIA labeling.

```typescript
<WizardFormField
  name="fieldName"
  label="Field Label"
  required
  description="Help text for the field"
>
  <WizardInput placeholder="Enter value" />
</WizardFormField>
```

**Props:**
- `name: string` - Field name for form binding
- `label: string` - Field label (automatically linked)
- `description?: string` - Help text (linked via aria-describedby)
- `required?: boolean` - Shows required indicator and validation
- `children: React.ReactNode` - Input component

### WizardInput
Enhanced input component with validation styling.

```typescript
<WizardInput
  placeholder="Enter text"
  maxLength={100}
/>
```

**Features:**
- Automatic error styling when validation fails
- Focus management with visual indicators
- Mobile-optimized touch targets
- Inherits all HTMLInputElement properties

### WizardTextarea
Multi-line text input with enhanced accessibility.

```typescript
<WizardTextarea
  placeholder="Enter description"
  rows={4}
  maxLength={500}
/>
```

**Features:**
- Resizable (vertical only)
- Character count support via maxLength
- Proper ARIA associations
- Validation error styling

### WizardSelect
Accessible select dropdown with validation.

```typescript
<WizardSelect
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  placeholder="Select an option"
/>
```

**Props:**
- `options: Array<{value: string, label: string}>` - Select options
- `placeholder?: string` - Placeholder text
- `error?: string` - Error state styling

### WizardButton
Consistent button styling with wizard variants.

```typescript
<WizardButton
  variant="primary"
  size="default"
  onClick={handleClick}
>
  Submit
</WizardButton>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'cancel'` - Button style variant
- `size?: 'sm' | 'default' | 'lg'` - Button size
- Standard button props (onClick, disabled, etc.)

### WizardFormSection
Section wrapper with consistent layout.

```typescript
<WizardFormSection
  title="Section Title"
  description="Section description"
>
  {/* Form fields */}
</WizardFormSection>
```

**Props:**
- `title?: string` - Section heading
- `description?: string` - Section description
- `children: React.ReactNode` - Section content

## Accessibility Features

### ARIA Support
- **Labels**: Automatic linking via FormLabel and htmlFor
- **Descriptions**: Help text linked via aria-describedby
- **Errors**: Validation messages announced to screen readers
- **Required Fields**: Proper aria-required and visual indicators

### Keyboard Navigation
- **Tab Order**: Logical focus progression through fields
- **Focus Indicators**: Clear visual focus rings
- **Enter Handling**: Form submission on Enter key
- **Escape Handling**: Field reset/cancel behavior

### Screen Reader Support
- **Field Announcements**: Label, description, and error read together
- **State Changes**: Validation errors announced dynamically
- **Progress**: Form completion status communicated
- **Instructions**: Clear usage instructions provided

## Validation Integration

### React Hook Form
All components integrate seamlessly with React Hook Form:

```typescript
import { useForm } from 'react-hook-form';

const form = useForm({
  mode: 'onChange', // Real-time validation
  defaultValues: {
    name: '',
    description: ''
  }
});

// Validation happens automatically via FormField
```

### Error Display
- **Automatic Error Styling**: Red borders and focus rings
- **Error Messages**: Display via FormMessage component  
- **Error Association**: aria-describedby links errors to inputs
- **Real-time Feedback**: Updates on change/blur events

### Validation Patterns
Common validation examples:

```typescript
// Required field
<WizardFormField name="name" label="Name" required>
  <WizardInput />
</WizardFormField>

// Length validation (handled by parent form)
const schema = yup.object({
  name: yup.string()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
});
```

## Migration Guide

### From Old Wizard Components

**Before:**
```typescript
import { WizardTextField, WizardFormGroup } from '@/components/shared/wizard';

<WizardFormGroup label="Name" error={errors.name}>
  <WizardTextField
    value={data.name}
    onChange={handleChange}
    error={errors.name}
  />
</WizardFormGroup>
```

**After:**
```typescript
import { WizardForm, WizardFormField, WizardInput } from '@/components/shared/wizard/components/WizardFormComponents';

<WizardForm data={data}>
  <WizardFormField name="name" label="Name" required>
    <WizardInput placeholder="Enter name" />
  </WizardFormField>
</WizardForm>
```

### Benefits of Migration
- ✅ **Better Accessibility**: WCAG 2.1 AA compliance
- ✅ **Type Safety**: Full TypeScript integration
- ✅ **Less Boilerplate**: Automatic validation and error handling
- ✅ **Consistent Styling**: shadcn/ui design system
- ✅ **Better Testing**: Easier to test form behavior

## Testing

### Test Utilities
```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { WizardForm, WizardFormField, WizardInput } from './WizardFormComponents';

test('form field displays validation error', async () => {
  const user = userEvent.setup();
  
  render(
    <WizardForm data={{ name: '' }}>
      <WizardFormField name="name" label="Name" required>
        <WizardInput />
      </WizardFormField>
    </WizardForm>
  );
  
  const input = screen.getByLabelText('Name *');
  await user.type(input, 'A'); // Too short
  
  // Validation error should appear
  expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
});
```

### Accessibility Testing
- **Screen Reader Testing**: Use NVDA/JAWS to verify announcements
- **Keyboard Testing**: Tab through forms, verify focus indicators
- **Color Contrast**: Ensure error states meet WCAG standards
- **Touch Testing**: Verify mobile touch targets (44px minimum)

## Examples

See the test harness for interactive examples:
- **Development Server**: `/dev/wizard-forms`
- **Storybook Stories**: `Narraitor/Shared/Patterns/WizardFormComponents`

## Performance

### Optimizations
- **Debounced Validation**: Prevents excessive re-renders
- **Controlled Components**: Efficient state management
- **Memoization**: React.memo on form components
- **Lazy Loading**: Dynamic imports for large forms

### Bundle Size
- **shadcn/ui**: Tree-shakeable components
- **React Hook Form**: Minimal runtime overhead
- **No External Dependencies**: Self-contained form system