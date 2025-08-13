---
title: Domain Integration
tags: [architecture, domains, integration]
created: 2025-04-29
updated: 2025-06-26
---

# Domain Integration

So the challenge was getting different parts of the app to work together without creating a tangled mess of dependencies. The approach we landed on is independent stores that components can access as needed, with clear boundaries between domains.

## Domain Structure

Basically, each major area of the app has its own responsibilities:

- **World**: World configuration, custom attributes, skills, and rules
- **Character**: Character creation, progression, and attribute management
- **Narrative**: AI story generation, choice presentation, and story flow
- **Journal**: Session tracking, decision history, and progress logging
- **Session**: Current game state, navigation, and user context
- **Inventory**: Items, equipment, and character possessions (future)
- **AI Context**: Prompt building, context management, and AI communication

## How They Work Together

The key insight is that **stores stay independent** - each domain manages its own state without directly depending on others. This makes testing way easier and prevents cascading failures where one broken thing breaks everything else.

For **cross-domain access**, components can read from multiple stores when they need data from different domains. So a game session component needs world rules, character data, and narrative state - it just reads from all three stores.

We keep **consistent patterns** across all stores - they all follow the same CRUD structure, so once you learn one store, the others are predictable.

The real win is **error containment** - if the AI service craps out, it doesn't break world creation or character management. Those keep working fine.

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

### Event-Driven Updates

```typescript
// Narrative generation triggers journal entries
function generateNarrativeWithJournal(sessionId: string, choice: string) {
  const { addSegment } = useNarrativeStore.getState();
  const { createEntry } = useJournalStore.getState();
  
  // Generate narrative
  const segment = addSegment({
    sessionId,
    content: `Player chose: ${choice}`,
    type: 'player-action'
  });
  
  // Auto-create journal entry
  createEntry({
    sessionId,
    type: 'decision',
    content: choice,
    narrativeSegmentId: segment.id
  });
  
  return segment;
}
```

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
- [Architecture Decisions](/users/jackhaas/projects/narraitor/docs/architecture/architecture-decisions.md)
- [State Management](/users/jackhaas/projects/narraitor/docs/architecture/state-management.md)
- [Technical Approach](/users/jackhaas/projects/narraitor/docs/architecture/technical-approach.md)