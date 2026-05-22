---
title: Domain Integration
tags: [architecture, domains, integration]
created: 2025-04-29
updated: 2026-05-22
---

# Domain Integration

The challenge is getting different parts of the app to work together without creating a tangled
mess of dependencies. The approach is independent stores that components access as needed, with
clear boundaries between domains.

## Domain Structure

Each major area of the app owns its own responsibilities:

- **World**: World configuration, custom attributes, skills, and rules
- **Character**: Character creation, progression, and attribute management
- **NPC**: Non-player characters, scoped to a world
- **Narrative**: AI story generation, choice presentation, and story flow
- **Journal**: Session tracking, decision history, and progress logging
- **Session**: Active game sessions tying a world and character together
- **Navigation**: App navigation and routing state
- **Inventory**: Items, equipment, and character possessions
- **Goal**: Character goals and objective tracking
- **Lore**: The world knowledge base — facts, aliases, deduplication, and resolution
- **AI Context**: Prompt building, context management, and AI communication

## How They Work Together

The key idea is that **stores stay independent** — each domain manages its own state without
directly importing others. That makes testing easier and stops cascading failures where one
broken thing takes down everything else.

For **reading across domains**, a component just pulls from multiple stores. A game session
component needs world rules, character data, and narrative state, so it reads from all three.

Stores keep **consistent patterns** — the entity stores share the `CrudStore<T>` shape, so once
you learn one, the others are predictable.

The payoff is **error containment** — if the AI service falls over, it doesn't break world
creation or character management. Those keep working.

For **writing across domains** (cascade deletes, mostly), stores don't import each other —
that would create circular dependencies. Instead they go through the `storeEvents` pub/sub bus
in `src/lib/state/storePubSub.ts`: the store that deletes something emits an event
(`StoreEventTypes.WORLD_DELETED`, `CHARACTER_DELETED`), and the stores that care subscribe and
clean up their own slice. See [Store-to-Store Communication](#store-to-store-communication) below.

## Integration Patterns

### Cross-Domain Data Access

```typescript
// Component accessing multiple domains
function GameSession() {
  const { worlds, currentWorldId } = useWorldStore();
  const { characters } = useCharacterStore();
  const { segments } = useNarrativeStore();
  const { entries } = useJournalStore();
  
  const currentWorld = worlds[currentWorldId];
  const worldCharacters = Object.values(characters)
    .filter(char => char.worldId === currentWorldId);
  
  return (
    <div>
      <h1>{currentWorld?.name}</h1>
      <p>Characters: {worldCharacters.length}</p>
      <p>Story segments: {segments.length}</p>
      <p>Journal entries: {entries.length}</p>
    </div>
  );
}
```

### Store-to-Store Communication

```typescript
// Character creation references world data
function createCharacterForWorld(worldId: string, characterData: any) {
  const { worlds } = useWorldStore.getState();
  const { createCharacter } = useCharacterStore.getState();
  
  const world = worlds[worldId];
  if (!world) throw new Error('World not found');
  
  // Use world attributes/skills for validation
  const character = createCharacter({
    ...characterData,
    worldId,
    attributes: validateAttributes(characterData.attributes, world.attributes)
  });
  
  return character;
}
```

### Event-Driven Cascades

When a delete in one domain has to clean up another, the work goes through the `storeEvents`
bus rather than a direct cross-store import. The deleting store emits; interested stores
subscribe and handle their own cleanup, which keeps the dependency arrows from forming a cycle:

```typescript
import { storeEvents, StoreEventTypes } from '@/lib/state/storePubSub';

// worldStore, after removing a world from its own state:
storeEvents.emit(StoreEventTypes.WORLD_DELETED, { worldId });

// characterStore wires up its cleanup once, at module load:
storeEvents.on(StoreEventTypes.WORLD_DELETED, ({ worldId }) => {
  // remove characters that belonged to the deleted world
});
```

This is the one place stores reach across domains, and it's intentional — see the
[State Management Guide](./state-management-guide.md) for the full rationale.

## Error Handling

Each store handles its own error state, which keeps problems from spreading:

```typescript
// Store-level error handling
const handleError = (error: Error, operation: string) => {
  console.error(`${operation} failed:`, error);
  setError(`Failed to ${operation}: ${error.message}`);
  setLoading(false);
};

// Cross-store error isolation
const createCharacterSafely = (worldId: string, data: any) => {
  try {
    const world = useWorldStore.getState().worlds[worldId];
    if (!world) {
      throw new Error('World not found');
    }
    return createCharacter({ ...data, worldId });
  } catch (error) {
    handleError(error, 'create character');
    return null;
  }
};
```

## Integration Testing

For testing cross-domain stuff, we use realistic scenarios that actually matter:

```typescript
test('character creation with world validation', () => {
  const { result: worldStore } = renderHook(() => useWorldStore());
  const { result: charStore } = renderHook(() => useCharacterStore());
  
  // Create test world
  const worldId = worldStore.current.createWorld(testWorldData);
  
  // Create character with world reference
  const charId = charStore.current.createCharacter({
    ...testCharData,
    worldId
  });
  
  expect(charStore.current.characters[charId].worldId).toBe(worldId);
});
```

## Related Documents
- [Architecture Decisions](./architecture-decisions.md)
- [State Management Guide](./state-management-guide.md)
- [Technical Approach](./technical-approach.md)