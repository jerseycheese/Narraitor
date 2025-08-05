# Type Guards Usage Guide

A comprehensive guide to using Narraitor's simplified type validation system for runtime type safety and validation.

## Overview

The type validation system provides comprehensive validation with detailed error messages for all domain objects:

- **ValidationResult API** - Primary validation functions that return detailed results with error messages
- **Legacy Type Guards** - Simple boolean checks for basic objects (InventoryItem, NarrativeSegment, etc.)

All validation functions support partial validation for form inputs and incomplete data.

## Core Validation Functions

### World Validation

```typescript
import { validateWorld } from '@/types/type-guards';

// Comprehensive validation with detailed error messages
const unknownData: unknown = getUserInput();
const result = validateWorld(unknownData);

if (result.valid) {
  // Data is valid - safe to use as World type
  console.log('World is valid');
  // TypeScript can infer this is valid world data
} else {
  console.log('Validation failed:');
  result.errors.forEach(error => console.log(`- ${error}`));
}
```

### Character Validation

```typescript
import { validateCharacter } from '@/types/type-guards';

// Validate complete character data
const character = getCharacterFromAPI();
const validation = validateCharacter(character);

if (validation.valid) {
  // Safe to use character properties
  updateCharacterDisplay(character);
} else {
  displayFormErrors(validation.errors);
}
```

## Partial Validation

Perfect for form validation where not all properties are present yet:

```typescript
// Form with only basic info filled
const partialWorld = {
  id: 'world-1',
  name: 'My Fantasy World',
  description: 'A magical realm'
  // Missing: genre, attributes, skills, etc.
};

// Partial validation - only checks present properties
const result = validateWorld(partialWorld, true);
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

### Character Components

```typescript
import { 
  isCharacterStatus,
  validateCharacterStatus,
  isCharacterRelationship 
} from '@/types/type-guards';

// Character status with health validation
const status = {
  health: 75,
  maxHealth: 100,
  conditions: ['blessed', 'well-rested'],
  location: 'Castle Courtyard'
};

if (isCharacterStatus(status)) {
  const healthPercent = (status.health / status.maxHealth) * 100;
  updateHealthBar(healthPercent);
}

// Relationship validation with strength range checking
const relationship = {
  characterId: 'npc-mentor',
  type: 'ally',
  strength: 75, // Must be -100 to 100
  description: 'My trusted mentor'
};

if (isCharacterRelationship(relationship)) {
  displayRelationship(relationship);
}
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

- **Type Guards** (`isWorld`, `isCharacter`) are optimized for speed - use for hot paths
- **ValidationResult API** (`validateWorld`, `validateCharacter`) provides detailed errors but is slower
- Partial validation is faster than full validation - use when appropriate

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

## Available Validation Functions

### Core Objects
- `validateWorld` - Comprehensive World validation
- `validateCharacter` - Comprehensive Character validation

### World Components
- `validateWorldAttribute` - World attribute validation with range checking
- `validateWorldSkill` - World skill validation with difficulty enum validation
- `validateWorldSettings` - World settings validation with positive number requirements
- `validateWorldImage` - World image validation with type enum validation

### Character Components
- `validateCharacterAttribute` - Character attribute validation with non-negative values
- `validateCharacterSkill` - Character skill validation with level and experience checks
- `validateCharacterBackground` - Character background validation with array content validation
- `validateCharacterStatus` - Character status validation with health constraints
- `validateCharacterRelationship` - Character relationship validation with type and strength validation
- `validateCharacterPortrait` - Character portrait validation with type enum validation

### Legacy Type Guards (Boolean)
- `isInventoryItem` - Simple inventory item validation
- `isNarrativeSegment` - Simple narrative segment validation
- `isJournalEntry` - Simple journal entry validation
- `isPlayerDecision` - Simple player decision validation

## Migration from Basic Type Checking

Replace basic property checks with comprehensive validation:

```typescript
// Before - manual property checking
function isValidWorld(obj: any): boolean {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.name === 'string';
}

// After - comprehensive validation
import { validateWorld } from '@/types/type-guards';

const result = validateWorld(data);
if (result.valid) {
  // Full validation including nested objects and ranges
  // Use data safely as World type
} else {
  // Handle specific errors
  console.log('Validation errors:', result.errors);
}
```

## Testing with Validation Functions

The validation functions are extensively tested and provide reliable validation:

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

This simplified validation system ensures runtime type safety while providing excellent developer experience with detailed error messages and clean, maintainable APIs.