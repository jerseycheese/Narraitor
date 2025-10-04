# Type Guards Usage Guide

So here's the thing - TypeScript gives you compile-time safety, but at runtime you're still dealing with unknown data from APIs, user input, and localStorage. The type guards system solves this by giving you runtime validation that actually works.

## Why This Exists

The challenge was that we kept getting runtime errors from invalid data - APIs returning unexpected shapes, localStorage containing old data formats, user forms with missing fields. TypeScript can't help you there because it only works at compile time.

The type guards system provides two approaches:

**Type Guards** - Fast boolean checks that narrow TypeScript types (`isWorld`)
**ValidationResult API** - Detailed validation with specific error messages (`validateWorld`)

World validation supports partial validation, which is perfect for form inputs where not all fields are filled yet.

## Core Type Guards

### World Validation

```typescript
import { isWorld, validateWorld } from '@/types/type-guards';

// Basic type guard - fast boolean check
const unknownData: unknown = getUserInput();
if (isWorld(unknownData)) {
  // TypeScript now knows this is a World
  console.log(unknownData.name); // Safe to access
  console.log(unknownData.genre);
}

// Detailed validation with error messages
const result = validateWorld(unknownData);
if (!result.valid) {
  console.log('Validation failed:');
  result.errors.forEach(error => console.log(`- ${error}`));
}
```


## Partial Validation

This is perfect for form validation where users are filling things out step by step:

```typescript
// Form with only basic info filled
const partialWorld = {
  id: 'world-1',
  name: 'My Fantasy World',
  description: 'A magical realm'
  // Missing: genre, attributes, skills, etc.
};

// Partial validation - only checks present properties
if (isWorld(partialWorld, { partial: true })) {
  // Valid for this stage of form completion
  saveFormProgress(partialWorld);
}

// Detailed partial validation
const result = validateWorld(partialWorld, { partial: true });
if (result.valid) {
  console.log('Form stage is valid');
} else {
  // Show specific errors for present properties
  showValidationErrors(result.errors);
}
```

## Domain-Specific Type Guards

### World Components

```typescript
import { 
  isWorldAttribute, 
  validateWorldAttribute,
  isWorldSkill,
  validateWorldSkill 
} from '@/types/type-guards';

// Validate world attributes with range checking
const attribute = {
  id: 'strength',
  name: 'Strength',
  worldId: 'world-1',
  description: 'Physical power',
  baseValue: 10,
  minValue: 1,
  maxValue: 20
};

if (isWorldAttribute(attribute)) {
  // Range validation is included
  console.log(`${attribute.name}: ${attribute.baseValue}`);
}

// Get specific range validation errors
const attrResult = validateWorldAttribute({
  ...attribute,
  baseValue: 25 // Exceeds maxValue
});
// attrResult.errors: ["Property baseValue must be less than or equal to maxValue"]
```


## Error Handling Patterns

### Form Validation

```typescript
function validateWorldForm(formData: unknown): { isValid: boolean; errors: string[] } {
  const result = validateWorld(formData, { partial: true });
  
  return {
    isValid: result.valid,
    errors: result.errors
  };
}

// Usage in form component
const { isValid, errors } = validateWorldForm(formData);
if (!isValid) {
  setFormErrors(errors);
  return;
}
```

### API Data Validation

```typescript
async function fetchWorld(id: string): Promise<World> {
  const response = await api.get(`/worlds/${id}`);
  
  if (!isWorld(response.data)) {
    throw new Error('Invalid world data received from API');
  }
  
  return response.data; // TypeScript knows this is World
}

// With detailed error logging
async function fetchWorldWithValidation(id: string): Promise<World> {
  const response = await api.get(`/worlds/${id}`);
  const validation = validateWorld(response.data);
  
  if (!validation.valid) {
    console.error('API validation failed:', validation.errors);
    throw new Error(`Invalid world data: ${validation.errors.join(', ')}`);
  }
  
  return response.data;
}
```

### Data Import Validation

```typescript
function importWorldData(jsonData: unknown[]): { success: World[]; errors: Array<{ index: number; errors: string[] }> } {
  const success: World[] = [];
  const errors: Array<{ index: number; errors: string[] }> = [];
  
  jsonData.forEach((item, index) => {
    const validation = validateWorld(item);
    if (validation.valid) {
      success.push(item as World);
    } else {
      errors.push({ index, errors: validation.errors });
    }
  });
  
  return { success, errors };
}
```

## Performance Considerations

So there's a trade-off here: **Type Guards** like `isWorld` and `isCharacter` are optimized for speed - use these in hot paths where you just need to know "is this valid or not?"

**ValidationResult API** like `validateWorld` and `validateCharacter` provides detailed error messages but is slower - use these when you need to show users what's wrong.

Partial validation is faster than full validation because it skips missing properties - use it when appropriate.

```typescript
// Fast path - use type guards
if (isWorld(data)) {
  processWorld(data);
}

// Detailed validation - use when errors need to be shown
const result = validateWorld(data);
if (!result.valid) {
  showUserErrors(result.errors);
}
```

## Available Type Guards

### Core Objects
- `isWorld` / `validateWorld`

### World Components
- `validateWorldAttribute`
- `validateWorldSkill`
- `validateWorldSettings`
- `validateWorldImage`

### Other Domain Objects
- `isInventoryItem`
- `isNarrativeSegment`
- `isJournalEntry`
- `isPlayerDecision`

## Migration from Basic Type Checking

If you've been doing manual property checking, the type guards are much more reliable:

```typescript
// Before - manual property checking
function isValidWorld(obj: any): boolean {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.name === 'string';
}

// After - comprehensive type guard
import { isWorld } from '@/types/type-guards';

if (isWorld(data)) {
  // Full validation including nested objects and ranges
}
```

## Testing with Type Guards

The type guards are extensively tested and provide reliable validation:

```typescript
import { validateWorld } from '@/types/type-guards';

// Test data validation in your tests
test('API returns valid world data', async () => {
  const worldData = await fetchWorldFromAPI();
  const validation = validateWorld(worldData);
  
  expect(validation.valid).toBe(true);
  if (!validation.valid) {
    console.log('Validation errors:', validation.errors);
  }
});
```

This type guard system ensures runtime type safety while providing excellent developer experience with detailed error messages and TypeScript integration. Basically, it gives you confidence that your data is what you think it is, which prevents a lot of runtime errors.