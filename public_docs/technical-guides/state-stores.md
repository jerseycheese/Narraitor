---
title: State Store Implementation
tags: [state, zustand, stores]
created: 2025-05-13
updated: 2026-05-22
---

# State Store Implementation

State in Narraitor is split by domain — each major feature area owns a Zustand store rather
than everything piling into one global blob. That keeps data flow easy to reason about and
means a change to, say, inventory logic doesn't ripple through unrelated state. Every store
lives in `src/state/` and is exported as a `useXStore` hook.

## The stores

There are fourteen domain stores today:

1. **`useWorldStore`** — game worlds, their attributes, skills, and configuration.
2. **`useCharacterStore`** — player characters, scoped to a world, with their attributes and skills.
3. **`useNPCStore`** — non-player characters, scoped to a world via `worldId`, with world-scoped queries.
4. **`useInventoryStore`** — per-character items: stack merging, acquisition history, AI/manual categorization, and item usage.
5. **`useNarrativeStore`** — story segments, ordering, and session-scoped narrative progression.
6. **`useJournalStore`** — journal entries by type (including `item_usage`), read/unread state, and links back to related items.
7. **`useSessionStore`** — active game sessions that tie a world and character together.
8. **`useAiContextStore`** — prompt context per session, with optional token tracking.
9. **`useGoalStore`** — character goals and objective tracking.
10. **`useNavigationStore`** — app navigation and routing state.
11. **`useLoreStore`** — the world knowledge base. This one's big enough that it's split across a
    family of files (`loreStore.ts` plus `loreStore.actions`, `.aliases`, `.deduplication`,
    `.extraction`, `.helpers`, `.import-export`, `.resolution`, `.state`, `.utils`), which keeps
    the dedup/resolution logic out of the core store file.
12. **`useCalibrationStore`** — token-budget request snapshots for the DevTools panel. Ephemeral, dev-only observability; never persisted.
13. **`useContinuityStore`** — narrative-continuity validation results for the DevTools panel. Ephemeral, dev-only observability; never persisted.
14. **`useProviderStore`** — AI provider configuration: provider/model selection and encrypted key storage. Persisted.

Two more files in `src/state/` support the stores rather than being stores themselves:

- **`crudStore.types.ts`** is a shared type contract, not a factory. It exports `CrudStore<T>`
  (the standard CRUD state + actions shape) that `goalStore` and `loreStore` build against. The
  factory function that used to live here was removed as dead code — only the types remain.
- **`persistence.ts`** exports `createIndexedDBStorage`, the IndexedDB-backed storage adapter the
  persisted stores use.

## Cross-store communication

Some operations have to reach across stores — deleting a world should clean up its characters,
deleting a character should clean up what it owns. Wiring those stores to import each other
directly would create circular dependencies, so cross-store handoffs go through a small event
bus in `src/lib/state/storePubSub.ts`. It exports `storeEvents` (the bus) and `StoreEventTypes`
(the event names like `WORLD_DELETED` and `CHARACTER_DELETED`). A store publishes an event when
it deletes something; interested stores subscribe and do their own cleanup. This is deliberate —
don't replace it with direct imports.

## Common patterns

### Standard CRUD shape

Stores that manage a collection of entities follow the `CrudStore<T>` shape: an `entities`
record keyed by id, a `currentEntityId`, `error` and `loading` flags, and the usual
`create`/`update`/`delete`/`getById`/`getAll` actions plus `reset`, `setError`, `clearError`,
and `setLoading`.

### Error handling

Actions validate before they mutate, so a bad operation sets a user-friendly error rather than
corrupting state:

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

### ID generation

IDs come from one helper so they're consistent and prefixed by type:

```typescript
import { generateUniqueId } from '@/lib/utils/generateId';

const worldId = generateUniqueId('world');
const characterId = generateUniqueId('char');
const itemId = generateUniqueId('item');
```

## Using a store

### In components

Call the hook with a selector so the component only re-renders when the slice it cares about
changes:

```typescript
import { useWorldStore } from '@/state/worldStore';

function WorldList() {
  const worlds = useWorldStore((state) => Object.values(state.worlds));
  const currentWorldId = useWorldStore((state) => state.currentWorldId);
  const createWorld = useWorldStore((state) => state.createWorld);

  const handleCreate = () => {
    const id = createWorld({ name: 'New World', genre: 'fantasy' });
  };

  // ...
}
```

### Outside components

For non-React code (services, tests, AI helpers), reach the store imperatively through
`getState()`:

```typescript
const worlds = Object.values(useWorldStore.getState().worlds);

useWorldStore.getState().createWorld({ name: 'Test World' });
```

### Subscribing to changes

```typescript
const unsubscribe = useWorldStore.subscribe(
  (state) => state.currentWorldId,
  (currentWorldId) => {
    // react to the change
  }
);

unsubscribe();
```

## Integration testing

Cross-store relationships get exercised in integration tests, since that's where the
world-character-session wiring tends to break:

```typescript
it('should create character in existing world', () => {
  const worldId = useWorldStore.getState().createWorld({ name: 'Test World' });

  const characterId = useCharacterStore.getState().createCharacter({
    name: 'Test Character',
    worldId,
  });

  const character = useCharacterStore.getState().characters[characterId];
  expect(character.worldId).toBe(worldId);
});
```

The state, storage, and narrative layers are also covered by mutation testing (see
`stryker.config.json`), which targets `src/state/**` specifically — state bugs are exactly the
kind of thing a passing-but-weak test suite tends to miss.

## Best practices

The short version: subscribe to the narrowest slice you need, validate input before saving,
clean up related data on delete (or publish the right `storeEvents` event so other stores can),
and never mutate state in place — always return new objects. State bugs are painful to track
down, so the test coverage here is intentionally heavier than elsewhere.
