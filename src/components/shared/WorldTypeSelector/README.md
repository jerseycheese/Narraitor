# WorldTypeSelector

A reusable component for consistent world type selection across all world creation entry points in the Narraitor application.

## Overview

The WorldTypeSelector component provides a standardized interface for users to choose between three world creation types:

- **Original World**: Generate a completely original world
- **Inspired By**: Generate a world inspired by existing fiction/settings  
- **Set Within**: Generate a world directly within existing fiction/settings

## Features

- ✅ **Consistent UI/UX** across all world creation flows
- ✅ **Conditional field rendering** based on selected world type
- ✅ **Built-in validation** with clear error messages
- ✅ **Flexible sizing and layout** options
- ✅ **TypeScript support** with full type safety
- ✅ **Business logic abstraction** with utility functions

## Usage

### Basic Usage

```tsx
import { WorldTypeSelector, WorldTypeData, createInitialWorldTypeData } from '@/components/shared/WorldTypeSelector';

function MyComponent() {
  const [data, setData] = useState<WorldTypeData>(createInitialWorldTypeData());

  return (
    <WorldTypeSelector
      value={data}
      onChange={setData}
    />
  );
}
```

### With Custom Hook

```tsx
import { useWorldTypeSelection } from '@/hooks/useWorldTypeSelection';

function MyComponent() {
  const { data, updateData, validation, generationParams } = useWorldTypeSelection();

  return (
    <WorldTypeSelector
      value={data}
      onChange={updateData}
    />
  );
}
```

### Generate World with Abstracted Logic

```tsx
import { convertToGenerationParams } from '@/components/shared/WorldTypeSelector';

// Convert user selections to API parameters
const { reference, relationship } = convertToGenerationParams(data);

// Call world generation API
const world = await generateWorld({
  method: 'ai',
  reference,
  relationship,
  existingNames,
  suggestedName
});
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `WorldTypeData` | Required | Current world type data |
| `onChange` | `(data: WorldTypeData) => void` | Required | Callback when data changes |
| `showLabels` | `boolean` | `true` | Whether to show field labels |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `disabled` | `boolean` | `false` | Whether component is disabled |
| `className` | `string` | `''` | Additional CSS classes |

## Types

### WorldTypeData

```typescript
interface WorldTypeData {
  worldType: 'original' | 'inspired_by' | 'set_within';
  worldReference: string;        // Required for 'inspired_by' and 'set_within'
  additionalDetails: string;     // Always required
}
```

### WorldGenerationParams

```typescript
interface WorldGenerationParams {
  reference?: string;            // Combined reference string for AI
  relationship?: 'based_on' | 'set_in';
}
```

## Utility Functions

### `validateWorldTypeData(data: WorldTypeData): string[]`

Validates world type data and returns array of error messages.

```tsx
const errors = validateWorldTypeData(data);
const isValid = errors.length === 0;
```

### `convertToGenerationParams(data: WorldTypeData): WorldGenerationParams`

Converts user input to API parameters with proper reference combination.

```tsx
const params = convertToGenerationParams({
  worldType: 'set_within',
  worldReference: 'Washington DC',
  additionalDetails: 'The day of Abraham Lincoln\'s assassination'
});
// Result: { 
//   reference: "Washington DC. Specific setting/time: The day of Abraham Lincoln's assassination",
//   relationship: 'set_in' 
// }
```

### `createInitialWorldTypeData(worldType?: WorldType): WorldTypeData`

Creates initial data structure with proper defaults.

## Integration Examples

### Guided First-Time Experience
```tsx
// Before (duplicated logic)
interface OnboardingData {
  worldType: 'original' | 'inspired_by' | 'set_within';
  worldReference: string;
  description: string;
}

// After (abstracted)
interface OnboardingData {
  name: string;
  genre: string;
  worldTypeData: WorldTypeData;
}
```

### Generate World Modal
```tsx
// Use the abstracted component instead of custom radio buttons
<WorldTypeSelector
  value={worldTypeData}
  onChange={setWorldTypeData}
  size="medium"
/>
```

### World Creation Wizard
```tsx
// Smart Templates can now include consistent world type selection
<WorldTypeSelector
  value={wizard.data.worldTypeData}
  onChange={(worldTypeData) => wizard.updateData({ worldTypeData })}
  layout="horizontal"
  size="large"
/>
```

## Business Logic Consistency

The abstraction ensures consistent behavior across all entry points:

1. **Validation Rules**: All entry points use the same validation logic
2. **Reference Combination**: Consistent format for AI generation
3. **Parameter Mapping**: Standardized conversion to API parameters
4. **Error Messages**: Uniform error messaging across the app

## Migration Guide

### From Custom Implementation

1. **Replace custom radio buttons** with `<WorldTypeSelector>`
2. **Update data structure** to use `WorldTypeData`
3. **Use utility functions** instead of custom validation/conversion
4. **Remove duplicated business logic**

### Example Migration

```tsx
// Before
const [worldType, setWorldType] = useState('original');
const [worldReference, setWorldReference] = useState('');
const [description, setDescription] = useState('');

// Custom validation logic...
// Custom parameter conversion...

// After
const [worldTypeData, setWorldTypeData] = useState(createInitialWorldTypeData());
const { reference, relationship } = convertToGenerationParams(worldTypeData);
```

## Testing

The component includes comprehensive Storybook stories demonstrating:

- All size variants (small, medium, large)
- Layout options (vertical, horizontal)
- Pre-filled examples for each world type
- Validation states and error handling
- Interactive examples with live data display

Run Storybook to see all examples:
```bash
npm run storybook
```

## Future Enhancements

- **Preset Templates**: Quick-select buttons for popular universes
- **Custom Validation**: Per-entry-point validation rules
- **Theming Support**: Customizable styling via CSS variables
- **Accessibility**: Enhanced ARIA support and keyboard navigation