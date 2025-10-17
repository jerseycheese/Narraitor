---
title: State Store Implementation
tags: [state, zustand, stores]
created: 2025-05-13
updated: 2025-06-08
---

# State Store Implementation

State management in Narraitor follows domain-driven design - each major feature area gets its own Zustand store. This keeps things organized and makes it easier to reason about data flow.

## Store Overview

**7 Domain Stores:**
1. **World Store** - Game worlds, attributes, and configuration settings
2. **Character Store** - Player and NPC characters with their stats  
3. **Inventory Store** - Character items and equipment management
4. **Narrative Store** - Story segments and narrative progression
5. **Journal Store** - Journal entries and quest tracking
6. **Session Store** - Active game sessions linking worlds and characters
7. **AI Context Store** - Context management for AI prompt generation

## Common Patterns

### Store Interface
Every store follows the same basic pattern so you know what to expect:

```typescript
interface StoreInterface {
  // State
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
All stores handle errors the same way - check if the operation is valid before doing it:

```typescript
addSkill: (characterId, skillData) => set((state) => {
  const character = state.characters[characterId];
  if (!character) {
    return { error: 'Character not found' };
  }

  if (character.skills.length >= 2) {
    return { error: 'Maximum skills limit reached' };
  }

  // ... continue with operation
});
```

### Validation
Input validation for all operations:

```typescript
createWorld: (worldData) => {
  if (!worldData.name || worldData.name.trim() === '') {
    throw new Error('World name is required');
  }
  // ... continue with creation
};
```

### ID Generation
Consistent ID generation:

```typescript
import { generateUniqueId } from '../lib/utils/generateId';

const worldId = generateUniqueId('world');
const characterId = generateUniqueId('char');
const itemId = generateUniqueId('item');
```

### World Store
- Manages world attributes and skills
- Enforces limits on attributes/skills per world
- Updates nested entities maintaining referential integrity

### Character Store
- Links characters to specific worlds
- Manages character attributes and skills
- Simplified skill limit for MVP (hardcoded to 2)

### Inventory Store
- Tracks items per character with acquisition history
- Performs automatic stack merging with max-stack enforcement
- Stores AI/manual categorization metadata per item
- Provides helpers for programmatic additions via `addItemToInventory`
- Handles item usage through `useItem()` method with consumption logic
- Returns usage results including narrative content and remaining quantities

### Narrative Store
- Associates segments with sessions
- Maintains segment ordering
- Provides session-specific queries

### Journal Store
- Filters entries by type (including 'item_usage' for item usage events)
- Tracks read/unread state
- Supports session-specific entries
- Creates automatic entries for significant item usage moments
- Links entries to related items through relatedEntities

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

1. **Use Selectors**: Don't dig into nested state - use selectors to get what you need
2. **Handle Errors**: Always check if the operation succeeded
3. **Validate Input**: Make sure data is valid before trying to save it
4. **Clean Up**: When you delete something, clean up related data too
5. **Test Thoroughly**: State bugs are hard to track down - test everything

## Performance Tips

Keep your stores fast:

1. **Subscribe Selectively**: Only listen to the state you actually need
2. **Memoize Selectors**: Use useMemo for expensive calculations
3. **Batch Updates**: Don't make 10 separate updates when you can make 1
4. **Avoid Subscriptions in Loops**: One subscription is better than many

## Common Pitfalls

Things that will bite you if you're not careful:

1. **Direct State Mutation**: Never mutate state directly - always create new objects
2. **Missing Error Handling**: Check if entities exist before trying to update them
3. **Orphaned Data**: Don't leave references to deleted entities hanging around
4. **Race Conditions**: Be careful with async operations that might complete out of order

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
