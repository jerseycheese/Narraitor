---
title: Domain Integration
tags: [architecture, domains, integration]
created: 2025-04-29
updated: 2025-06-26
---

# Domain Integration

How different domains communicate and integrate using Zustand stores.

## Domain Boundaries

**Core Domains:**
- **World**: World configuration, attributes, skills
- **Character**: Character data, progression, attributes
- **Narrative**: Story generation, choices, progression
- **Journal**: Entry tracking, session history
- **Session**: Game state, navigation
- **Inventory**: Items, equipment, effects
- **AI Context**: Prompt management, context building

## Integration Principles

1. **Store Independence**: Each domain has its own Zustand store
2. **Cross-Store Communication**: Components access multiple stores as needed
3. **Consistent Patterns**: All stores follow the same CRUD structure
4. **Error Isolation**: Domain errors don't cascade to other domains
5. **Type Safety**: TypeScript interfaces ensure contract compliance

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

Each store manages its own error state:

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

Test cross-domain functionality with realistic scenarios:

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