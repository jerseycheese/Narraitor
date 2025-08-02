---
title: State Management Usage
tags: [state-management, zustand]
created: 2025-05-13
updated: 2025-06-26
---

# State Management Usage

So here's how to actually work with the Zustand stores in practice. Each major area of the app has its own store, which keeps things organized and makes it easier to reason about state changes.

## How the Stores Work

Each domain gets its own store - World, Character, Narrative, etc. They all follow the same patterns, so once you learn one, the others are predictable. All stores include CRUD operations, loading states, and error handling.

## Available Stores

| Store | Purpose | Features |
|-------|---------|----------|
| `useWorldStore` | World configurations | CRUD operations, IndexedDB persistence |
| `useCharacterStore` | Character data | Multi-character support, attribute/skill management |
| `useNarrativeStore` | Story segments | Context management, decision tracking |
| `useJournalStore` | Journal entries | Session grouping, entry categorization |
| `useSessionStore` | Game sessions | Session state, navigation tracking |
| `useInventoryStore` | Item management | Equipment tracking, item effects |
| `useAiContextStore` | AI prompt context | Context building, token management |

## Basic Usage

**Basic Usage Pattern** - Import the hook and destructure what you need:

```typescript
import { useWorldStore } from '@/state/worldStore';

function MyComponent() {
  const { worlds, createWorld, currentWorldId } = useWorldStore();
  const { characters, createCharacter } = useCharacterStore();
  
  return (
    <div>
      <h1>Current World: {worlds[currentWorldId]?.name}</h1>
      <p>Characters: {Object.keys(characters).length}</p>
    </div>
  );
}
```

Components automatically re-render when the store data they're using changes.

### Store Actions

```typescript
// World operations
const { createWorld, updateWorld, deleteWorld, setCurrentWorld } = useWorldStore();

// Create new world
const worldId = createWorld({
  name: 'Fantasy Realm',
  genre: 'fantasy',
  description: 'A magical world of wizards and dragons'
});

// Update existing world
updateWorld(worldId, { description: 'Updated description' });

// Set as current world
setCurrentWorld(worldId);
```

### Persistence

All stores automatically persist to IndexedDB:

```typescript
// State is automatically saved to IndexedDB
const { createCharacter } = useCharacterStore();

// This will be persisted automatically
createCharacter({
  name: 'Gandalf',
  worldId: 'world-123',
  attributes: [{ id: 'strength', value: 8 }]
});
```

## Store Patterns

### Error Handling

```typescript
const { error, clearError, setError } = useWorldStore();

// Check for errors
if (error) {
  return <div>Error: {error}</div>;
}

// Clear errors
const handleRetry = () => {
  clearError();
  // Retry operation
};
```

### Loading States

```typescript
const { loading, setLoading } = useNarrativeStore();

const generateNarrative = async () => {
  setLoading(true);
  try {
    // AI generation logic
  } finally {
    setLoading(false);
  }
};
```

### Selectors

```typescript
// Select specific data from store
const currentWorld = useWorldStore((state) => 
  state.worlds[state.currentWorldId]
);

const characterCount = useCharacterStore((state) => 
  Object.keys(state.characters).length
);
```

## Testing Stores

```typescript
import { useCharacterStore } from '@/state/characterStore';

describe('CharacterStore', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
  });

  it('creates character successfully', () => {
    const { createCharacter, characters } = useCharacterStore.getState();
    
    const characterId = createCharacter({
      name: 'Test Character',
      worldId: 'world-1'
    });
    
    expect(characters[characterId]).toMatchObject({
      name: 'Test Character',
      worldId: 'world-1'
    });
  });
});
```

## Common Patterns

### Cross-Store Dependencies

```typescript
// Get data from multiple stores
function GameSession() {
  const { worlds, currentWorldId } = useWorldStore();
  const { characters } = useCharacterStore();
  const { segments } = useNarrativeStore();
  
  const currentWorld = worlds[currentWorldId];
  const worldCharacters = Object.values(characters)
    .filter(char => char.worldId === currentWorldId);
  
  return (
    <div>
      <h1>{currentWorld?.name}</h1>
      <p>Characters: {worldCharacters.length}</p>
      <p>Story segments: {segments.length}</p>
    </div>
  );
}
```

### Computed Values

```typescript
// Create computed selectors
const useWorldStats = (worldId: string) => {
  return useCharacterStore((state) => {
    const worldCharacters = Object.values(state.characters)
      .filter(char => char.worldId === worldId);
    
    return {
      characterCount: worldCharacters.length,
      totalLevels: worldCharacters.reduce((sum, char) => sum + char.level, 0)
    };
  });
};
```

## Best Practices

1. **Use selectors** for performance optimization
2. **Reset state** in tests to avoid test pollution
3. **Handle errors** gracefully with error states
4. **Batch updates** when making multiple changes
5. **Use TypeScript** for type safety throughout