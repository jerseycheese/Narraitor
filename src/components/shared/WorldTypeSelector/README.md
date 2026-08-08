# WorldTypeSelector

We had world type selection logic scattered across multiple components, each implementing it slightly differently. This component centralizes all that logic so we get consistent behavior everywhere.

## The Three World Types

Users can create worlds in three different ways, and each needs different information:

- **Original World**: Generate a completely original world (just needs additional details)
- **Inspired By**: Generate a world inspired by existing fiction/settings ("like Star Wars but...")
- **Set Within**: Generate a world directly within existing fiction/settings ("in the Star Wars universe")

## What Problem This Solves

Before this component, we had world type selection scattered across the guided experience, generate world modal, and wizard components. Each one handled validation differently, combined the reference fields differently, and had slightly different UIs. This was a maintenance nightmare.

Now we have:
- **Consistent UI/UX** across all world creation flows
- **Smart field rendering** - reference field only shows up when needed
- **Unified validation** with clear error messages
- **Flexible sizing and layout** options for different contexts
- **Full TypeScript support** so you can't mess up the data flow
- **Business logic abstraction** - all the gnarly reference combination logic is hidden away

## Usage

### Basic Usage

The simplest way to use this is just drop it in and let it manage its own state:

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

### Generate World with Abstracted Logic

This is where the real value is - the conversion logic handles all the tricky reference field combination:

```tsx
import { convertToGenerationParams } from '@/components/shared/WorldTypeSelector';

// Convert user selections to API parameters
const { reference, relationship } = convertToGenerationParams(data);

// Call world generation API - no need to worry about combining fields
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

The component includes Storybook stories demonstrating:

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