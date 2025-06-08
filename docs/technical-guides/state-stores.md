---
title: "State Store Implementation Guide"
type: guide
category: state-management
tags: [state, zustand, stores, implementation]
created: 2025-05-13
updated: 2025-06-08
---

# State Store Implementation Guide

This guide provides detailed information about the Zustand store implementations in the Narraitor project.

## Store Overview

The Narraitor application uses 7 distinct Zustand stores, each managing a specific domain:

1. **World Store** - Game worlds and their configurations
2. **Character Store** - Player and NPC characters
3. **Inventory Store** - Character items and equipment
4. **Narrative Store** - Story segments and progression
5. **Journal Store** - Journal entries and quest tracking
6. **Session Store** - Active game sessions
7. **AI Context Store** - AI prompt contexts and constraints

## Implementation Details

### Common Patterns

All stores follow these consistent patterns:

```typescript
interface StoreInterface {
  // State properties
  entities: Record<EntityID, Entity>;
  currentEntityId: EntityID | null;
  error: string | null;
  loading: boolean;

  // CRUD operations
  createEntity: (data: EntityData) => EntityID;
  updateEntity: (id: EntityID, updates: Partial<Entity>) => void;
  deleteEntity: (id: EntityID) => void;
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
```

### Error Handling

Each store implements consistent error handling:

```typescript
// Example from characterStore
addSkill: (characterId, skillData) => set((state) => {
  const character = state.characters[characterId];
  if (!character) {
    return { error: 'Character not found' };
  }

  // Check max skills limit
  if (character.skills.length >= 2) {
    return { error: 'Maximum skills limit reached' };
  }

  // ... continue with operation
});
```

### Validation

All stores include input validation:

```typescript
createWorld: (worldData) => {
  if (!worldData.name || worldData.name.trim() === '') {
    throw new Error('World name is required');
  }
  
  // ... continue with creation
};
```

### ID Generation

All entities use a consistent ID generation pattern:

```typescript
import { generateUniqueId } from '../lib/utils/generateId';

const worldId = generateUniqueId('world');
const characterId = generateUniqueId('char');
const itemId = generateUniqueId('item');
```

## Store-Specific Features

### World Store
- Manages world attributes and skills
- Enforces limits on attributes/skills per world
- Updates nested entities maintaining referential integrity

### Character Store
- Links characters to specific worlds
- Manages character attributes and skills
- Simplified skill limit for MVP (hardcoded to 2)

### Inventory Store
- Tracks items per character
- Supports item transfers between characters
- Calculates inventory weight
- Manages equipped state

### Narrative Store
- Associates segments with sessions
- Maintains segment ordering
- Provides session-specific queries

### Journal Store
- Filters entries by type
- Tracks read/unread state
- Supports session-specific entries

### Session Store
- Creates sessions linking world and character
- Manages session state (active/completed)
- Tracks active session

### AI Context Store
- Manages prompt contexts per session
- Tracks token counts (optional)
- Clears context while preserving constraints

## Usage Guidelines

### In Components

```typescript
import { worldStore } from '@/state/worldStore';

function WorldList() {
  // Subscribe to specific state slices
  const worlds = worldStore((state) => Object.values(state.worlds));
  const currentWorldId = worldStore((state) => state.currentWorldId);
  const createWorld = worldStore((state) => state.createWorld);
  
  // Use state and actions
  const handleCreate = () => {
    const id = createWorld({
      name: 'New World',
      theme: 'fantasy',
      // ... other properties
    });
  };
  
  return (
    // ... component JSX
  );
}
```

### Outside Components

```typescript
// Get current state snapshot
const state = worldStore.getState();
const worlds = Object.values(state.worlds);

// Call actions directly
worldStore.getState().createWorld({
  name: 'Test World',
  // ... properties
});
```

### Subscribing to Changes

```typescript
// Subscribe to state changes
const unsubscribe = worldStore.subscribe(
  (state) => state.currentWorldId,
  (currentWorldId) => {
    console.log('Current world changed:', currentWorldId);
  }
);

// Don't forget to unsubscribe
unsubscribe();
```

## Integration Testing

Cross-store operations are tested in integration tests:

```typescript
// Example from storeIntegration.test.ts
it('should create character in existing world', async () => {
  // Create world
  const worldId = worldStore.getState().createWorld({
    name: 'Test World',
    // ... properties
  });
  
  // Create character in that world
  const characterId = characterStore.getState().createCharacter({
    name: 'Test Character',
    worldId,
    // ... properties
  });
  
  // Verify relationship
  const character = characterStore.getState().characters[characterId];
  expect(character.worldId).toBe(worldId);
});
```

## Best Practices

1. **Use Selectors**: Don't access nested state directly
2. **Handle Errors**: Check return values and state.error
3. **Validate Input**: Ensure data validity before updates
4. **Clean Up**: Remove related data when deleting entities
5. **Test Thoroughly**: Write tests for all scenarios

## Performance Tips

1. **Subscribe Selectively**: Only subscribe to needed state
2. **Memoize Selectors**: Use useMemo for complex calculations
3. **Batch Updates**: Combine multiple updates when possible
4. **Avoid Subscriptions in Loops**: Use a single subscription

## Common Pitfalls

1. **Direct State Mutation**: Always create new objects
2. **Missing Error Handling**: Check for entity existence
3. **Orphaned Data**: Clean up relationships
4. **Race Conditions**: Be careful with async operations

## Debugging

Use Zustand DevTools for debugging:

```typescript
import { devtools } from 'zustand/middleware';

export const worldStore = create<WorldStore>()(
  devtools(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'world-store',
    }
  )
);
```

## Future Considerations

1. **Persistence**: IndexedDB integration (issue #340)
2. **Middleware**: Logging, validation, persistence
3. **Optimistic Updates**: For better UX
4. **State Sync**: Multi-device synchronization
5. **Undo/Redo**: Time-travel functionality
