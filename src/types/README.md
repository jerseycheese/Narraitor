# Narraitor Type System

This directory contains all TypeScript type definitions for the Narraitor application's core domains.

## Overview

The type system provides type-safe interfaces for all major domains in the application:

- **Common Types**: Base types and interfaces used across domains
- **World Configuration**: Types for game world settings and attributes
- **Character System**: Character, attributes, skills, and inventory
- **Narrative Engine**: Story segments, decisions, and consequences
- **Journal System**: Event tracking and categorization
- **Session Management**: Game state and save points
- **AI Context**: Integration types for AI services

## Quick Start

```typescript
// Import specific types
import { World, Character, NarrativeSegment } from '@/types';

// Import type guards for runtime validation
import { isWorld, isCharacter } from '@/types';

// Import all types
import * as Types from '@/types';
```

## Type Structure

### Common Types
- `EntityID`: String identifier used across all entities
- `Timestamp`: ISO 8601 date string
- `TimestampedEntity`: Base interface with createdAt/updatedAt
- `NamedEntity`: Base interface with id, name, and optional description

### Domain-Specific Types

Each domain has its own type file with related interfaces:

```typescript
// World types
interface World extends NamedEntity, TimestampedEntity
interface WorldAttribute extends NamedEntity
interface WorldSkill extends NamedEntity
interface WorldSettings

// Character types
interface Character extends NamedEntity, TimestampedEntity
interface CharacterAttribute
interface CharacterSkill
interface CharacterStatus
interface CharacterBackground
interface CharacterRelationship

// And more...
```

## Type Guards

Runtime type checking is available for major interfaces:

```typescript
import { isWorld, isCharacter } from '@/types';

// Validate unknown data
if (isWorld(data)) {
  // TypeScript knows data is a World
  console.log(data.theme);
}
```

## Usage Examples

### Creating a New Character

```typescript
import { Character, EntityID } from '@/types';
import { generateUniqueId } from '@/lib/utils';

const newCharacter: Character = {
  id: generateUniqueId('char'),
  worldId: worldId,
  name: "Hero",
  attributes: [],
  skills: [],
  background: {
    history: "A mysterious wanderer",
    personality: "Brave and curious",
    goals: ["Find the ancient artifact"],
    fears: ["Darkness"],
    relationships: []
  },
  inventory: {
    characterId: generateUniqueId('char'),
    items: [],
    capacity: 20,
    categories: []
  },
  status: {
    health: 100,
    maxHealth: 100,
    conditions: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### Working with Decisions

```typescript
import { Decision, DecisionOption } from '@/types';

const decision: Decision = {
  id: generateUniqueId('dec'),
  prompt: "You encounter a locked door. What do you do?",
  options: [
    {
      id: generateUniqueId('opt'),
      text: "Try to pick the lock",
      requirements: [{
        type: 'skill',
        targetId: 'skill-lockpicking',
        operator: 'gte',
        value: 5
      }]
    },
    {
      id: generateUniqueId('opt'),
      text: "Force it open",
      requirements: [{
        type: 'attribute',
        targetId: 'attr-strength',
        operator: 'gte',
        value: 15
      }]
    }
  ]
};
```

## Best Practices

1. **Use Type Guards**: Always validate external data with type guards
2. **Prefer Interfaces**: Use interfaces over type aliases for object shapes
3. **Document Types**: Add JSDoc comments to all public interfaces
4. **Keep Types Pure**: Don't include business logic in type files
5. **Use Discriminated Unions**: For types with multiple variants

## Extending Types

When adding new features:

1. Add new interfaces to the appropriate domain file
2. Update the index.ts exports
3. Create corresponding type guards if needed
4. Add tests for new types
5. Update this README with new types

## Integration with State Management

These types are designed to work seamlessly with Zustand state management:

```typescript
import { World, Character } from '@/types';

interface GameState {
  worlds: Record<EntityID, World>;
  characters: Record<EntityID, Character>;
  // ...
}
```

## Testing

All types have comprehensive tests in `__tests__/`. Run tests with:

```bash
npm test src/types
```

## Related Documentation

- [Type System Design](/docs/api/types.md)
- [State Management](/docs/architecture/state-management.md)
- [Development Roadmap](/docs/development-roadmap.md)
