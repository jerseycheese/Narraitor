# Type Guards Usage Guide

TypeScript gives you compile-time safety, but at runtime you're still handling unknown data from APIs, user input, and localStorage. The type guards system covers that gap with runtime validation.

## Why This Exists

The challenge was that we kept getting runtime errors from invalid data - APIs returning unexpected shapes, localStorage containing old data formats, user forms with missing fields. TypeScript can't help you there because it only works at compile time.

The type guards system provides two approaches:

**Type Guards** - Fast boolean checks that narrow TypeScript types (`isWorld`)
**ValidationResult API** - Detailed validation with specific error messages (`validateWorld`)

World validation supports partial validation, which is perfect for form inputs where not all fields are filled yet.

## Core Type Guards

### World Validation

```typescript
import { validateWorld } from '@/lib/utils/typeGuards';

// Detailed validation with error messages
const unknownData: unknown = getUserInput();
const result = validateWorld(unknownData);

if (result.valid) {
  // Validation passed - safe to use as World
  const world = unknownData as World;
  console.log(world.name);
  console.log(world.genre);
} else {
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
const result = validateWorld(partialWorld, true); // true = partial mode
if (result.valid) {
  console.log('Form stage is valid');
  saveFormProgress(partialWorld);
} else {
  // Show specific errors for present properties
  showValidationErrors(result.errors);
}
```

## Domain-Specific Type Guards

### World Components

```typescript
import {
  validateWorldAttribute,
  validateWorldSkill
} from '@/lib/utils/typeGuards';

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

const attrResult = validateWorldAttribute(attribute);
if (attrResult.valid) {
  // Range validation passed
  console.log(`${attribute.name}: ${attribute.baseValue}`);
}

// Get specific range validation errors
const invalidAttr = validateWorldAttribute({
  ...attribute,
  baseValue: 25 // Exceeds maxValue
});
// invalidAttr.errors: ["Property baseValue must be less than or equal to maxValue"]
```


## Error Handling Patterns

### Form Validation

```typescript
function validateWorldForm(formData: unknown): { isValid: boolean; errors: string[] } {
  const result = validateWorld(formData, true); // true = partial mode

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
  const validation = validateWorld(response.data);

  if (!validation.valid) {
    throw new Error('Invalid world data received from API');
  }

  return response.data as World;
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

The **ValidationResult API** (like `validateWorld`) provides detailed error messages which is helpful when you need to show users what's wrong or debug validation issues.

Partial validation is faster than full validation because it skips missing properties - use it when appropriate (e.g., form validation).

```typescript
// Full validation - use for complete data structures
const result = validateWorld(data);
if (!result.valid) {
  showUserErrors(result.errors);
}

// Partial validation - faster for form inputs
const formResult = validateWorld(partialData, true);
if (!formResult.valid) {
  showFieldErrors(formResult.errors);
}
```

## Available Type Guards

### Core Objects
- `validateWorld` - World validation with detailed errors

### World Components
- `validateWorldAttribute`
- `validateWorldSkill`
- `validateWorldSettings`

### Other Domain Objects
- `isPlayerDecisionArray` - validates a whole array, not a single decision
- `sanitizeString`

## Migration from Basic Type Checking

If you've been doing manual property checking, the type guards are much more reliable:

```typescript
// Before - manual property checking
function isValidWorld(obj: any): boolean {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.name === 'string';
}

// After - full validation
import { validateWorld } from '@/lib/utils/typeGuards';

const result = validateWorld(data);
if (result.valid) {
  // Full validation including nested objects and ranges
  const world = data as World;
  processWorld(world);
}
```

## Testing with Type Guards

The type guards are extensively tested and provide reliable validation:

```typescript
import { validateWorld } from '@/lib/utils/typeGuards';

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

These type guards check shape at runtime and narrow types for TypeScript, so a value that came from storage or an AI response is verified before anything downstream trusts it. When a property fails, the error names it (`Property "name" must be a string`), which is enough to map it back to a form field. Input that isn't an object at all reports that instead, without a field name.