---
title: State Management Usage
tags: [state-management, zustand]
created: 2025-05-13
updated: 2025-06-26
---

# Working with State Management

This is how the Zustand stores work in practice. Each major area of the app gets its own store - World stuff, Character stuff, Narrative stuff - which keeps things organized and makes it easier to reason about what's changing and why.

## How the Stores Work

Each domain gets its own store - World, Character, Narrative, etc. They all follow the same patterns, so once you learn one, the others are predictable. All stores include CRUD operations, loading states, and error handling because those are the things you need in pretty much every store.

## Available Stores

There are fourteen domain stores, all in `src/state/` and exported as `useXStore` hooks:

| Store | Purpose | Features |
|-------|---------|----------|
| `useWorldStore` | World configurations | CRUD operations, IndexedDB persistence |
| `useCharacterStore` | Character data | Multi-character support, attribute/skill management |
| `useNPCStore` | Non-player characters | World-scoped, queries by world |
| `useNarrativeStore` | Story segments | Context management, decision tracking |
| `useJournalStore` | Journal entries | Session grouping, entry categorization |
| `useSessionStore` | Game sessions | Session lifecycle, world/character linking |
| `useNavigationStore` | App navigation | Routing and navigation state |
| `useInventoryStore` | Item management | Equipment tracking, item usage, images |
| `useGoalStore` | Goals/objectives | Character goal tracking |
| `useLoreStore` | World knowledge base | Facts, aliases, deduplication, resolution (split `loreStore.*` family) |
| `useAiContextStore` | AI prompt context | Context building, token management |
| `useCalibrationStore` | Token-budget snapshots (DevTools) | Ephemeral, dev-only, not persisted |
| `useContinuityStore` | Continuity validation (DevTools) | Ephemeral, dev-only, not persisted |
| `useProviderStore` | AI provider config | Provider/model selection, encrypted keys, persisted |

## Basic Usage

The pattern is simple - import the hook and destructure what you need:

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

Components automatically re-render when the store data they're using changes, which is the magic of Zustand.

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

All stores automatically persist to IndexedDB, so your data survives browser refreshes:

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
      // Character has no level field; derive from something that exists.
      namedCharacters: worldCharacters.map((char) => char.name)
    };
  });
};
```

## Best Practices

**Use selectors** for performance optimization - only subscribe to the data you actually need.

**Reset state** in tests to avoid test pollution - one test's data shouldn't affect another.

**Handle errors** with error states - the stores provide error handling, use it.

**Batch updates** when making multiple changes - don't trigger a re-render for every tiny change.

**Use TypeScript** for type safety throughout - the stores are fully typed, so take advantage of it.