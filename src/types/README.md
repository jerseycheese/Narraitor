# Type System

This directory contains all the TypeScript type definitions for the major domains in Narraitor. The basic idea is to have type-safe interfaces for everything so you catch errors at compile time instead of runtime, and to keep all the type definitions organized by what they're used for.

## Why This Matters

When you're dealing with complex state management and AI integration, having solid types is crucial. You want to know that a Character object has all the required fields, that a World's attributes match what the AI expects, and that you can't accidentally pass a Skill where an Attribute is expected. The type system catches these mistakes before they become bugs.

## How It's Organized

The types are split up by domain - World, Character, Narrative, Journal, etc. Each domain has its own file with related interfaces, plus some common types that get used everywhere:

- **Common Types**: Base interfaces like `EntityID`, timestamps, and shared patterns
- **World Configuration**: Types for game worlds, attributes, skills, and settings
- **Character System**: Character sheets, backgrounds, inventory, relationships
- **Narrative Engine**: Story segments, choices, consequences, AI context
- **Journal System**: Event tracking, categorization, filtering
- **Session Management**: Game state, save points, session data

## Basic Usage

Most of the time you'll just import the types you need:

```typescript
import { World, Character, NarrativeSegment } from '@/types';

// Use them in your components or stores
interface GameState {
  currentWorld: World | null;
  activeCharacter: Character | null;
  narrativeHistory: NarrativeSegment[];
}
```

There are also type guards available for runtime validation, which is useful when you're dealing with data from external sources or local storage:

```typescript
import { validateWorld } from '@/lib/utils/typeGuards';

// Validate unknown data
const data = JSON.parse(localStorage.getItem('savedGame'));
const validation = validateWorld(data.world);
if (validation.valid) {
  // TypeScript knows data.world is a World
  const world = data.world as World;
  console.log(world.theme);
}
```

## Common Type Patterns

### Base Types

Most entities share common patterns:

```typescript
// Every entity has a unique ID
type EntityID = string;

// Timestamped entities track when they were created/updated
interface TimestampedEntity {
  createdAt: string; // ISO 8601 date string
  updatedAt: string;
}

// Named entities have basic identity fields
interface NamedEntity {
  id: EntityID;
  name: string;
  description?: string;
}
```

### Domain Objects

Each domain builds on these base patterns:

```typescript
// World extends both base patterns
interface World extends NamedEntity, TimestampedEntity {
  theme: string;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
}

// Character does the same
interface Character extends NamedEntity, TimestampedEntity {
  worldId: EntityID;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  background: CharacterBackground;
  inventory: CharacterInventory;
}
```

## Working with the Types

### Creating New Objects

When you're creating new entities, you'll typically use the full interface:

```typescript
import { Character, EntityID } from '@/types';
import { generateUniqueId, getTimestamp } from '@/lib/utils';

const newCharacter: Character = {
  id: generateUniqueId('char'),
  worldId: selectedWorldId,
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
    conditions: []
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp()
};
```

### Handling Choices and Decisions

The decision system types are designed to work with the AI narrative engine:

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

## State Management Integration

These types work directly with Zustand stores. The typical pattern is to have a Record mapping IDs to entities:

```typescript
import { World, Character, EntityID } from '@/types';

interface WorldState {
  worlds: Record<EntityID, World>;
  currentWorldId: EntityID | null;
  createWorld: (worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateWorld: (id: EntityID, updates: Partial<World>) => void;
  deleteWorld: (id: EntityID) => void;
}
```

This pattern makes it easy to look up entities by ID and ensures the store methods have the right types.

## Type Guards

When you're dealing with data from external sources - localStorage, a persisted store, an AI
response - you can use validation functions to check the shape:

```typescript
import { validateWorld, isPlayerDecisionArray } from '@/lib/utils/typeGuards';

const hydrateWorld = (raw: unknown) => {
  const result = validateWorld(raw);
  if (!result.valid) {
    throw new Error(`Invalid world: ${result.errors.join(', ')}`);
  }
  return raw as World;
};
```

`src/lib/utils/typeGuards.ts` exports exactly six things: `validateWorld`,
`validateWorldAttribute`, `validateWorldSettings`, `validateWorldSkill`,
`isPlayerDecisionArray`, and `sanitizeString`. The `validate*` family returns
`ValidationResult` (`{ valid: boolean; errors: string[] }`), not a boolean. There are no guards
for narrative segments or journal entries, and there's no world import path - worlds aren't
importable from a file (see `public_docs/features/world-management.md`).

## Extending the Type System

When you need to add new features:

1. **Add the interface** to the appropriate domain file
2. **Update the index.ts** to export the new types
3. **Create type guards** if the type needs runtime validation
4. **Add tests** for the new types
5. **Update any related store interfaces**

For example, if you're adding a new inventory item type:

```typescript
// In inventory.ts
interface MagicalItem extends InventoryItem {
  type: 'magical';
  magicalProperties: {
    spellType: string;
    manaCost: number;
    cooldown: number;
  };
}

// In index.ts
export type { MagicalItem } from './inventory';
export { isMagicalItem } from './inventory';
```

## Best Practices

**Use interfaces over type aliases** for object shapes. Interfaces can be extended and merged, which makes them more flexible.

**Prefer composition over inheritance**. Use `extends` to combine base interfaces rather than creating deep hierarchies.

**Add JSDoc comments** to any interface that's not self-explanatory, especially for complex business logic types.

**Keep types pure**. Don't include functions or business logic in type files - just the data shapes.

**Use discriminated unions** when you have types with multiple variants. This makes TypeScript's type narrowing work better.

**Validate external data**. Always use type guards when dealing with data from outside the app.

The type system is designed to grow with the app, so don't hesitate to add new types or refactor existing ones as requirements change.
