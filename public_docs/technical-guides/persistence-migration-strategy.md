---
title: Persistence Migration Strategy
tags: [state-management, persistence, indexeddb, migration]
created: 2026-08-24
updated: 2026-08-24
---

# Persistence Migration Strategy

Every persisted Zustand store owns its own schema version and its own `migrate` function — there's no shared migration framework or central registry. This doc describes that setup as it exists today: how a version bump and a migrate function actually work, what Zustand's `persist` middleware does with them at hydration time, and where the current approach is thin. It's the doc [ADR-004](../architecture/ADR-004-indexeddb-persistence.md) points at when it says "migrations are the store's responsibility."

## The versioning scheme today

Each store that uses `persist()` sets its own `version: N` in its `PersistOptions`, independent of every other store. There's no app-wide schema version — bumping `worldStore` to v6 says nothing about `characterStore`'s version. Current versions, from `src/state/*.ts`:

| Store | Version | Migrate function |
|---|---|---|
| `worldStore` | 5 | version-gated (v3→v4, v4→v5) |
| `sessionStore` | 4 | version-gated (v2→v3, v3→v4) |
| `characterStore` | 3 | preserve-if-truthy no-op |
| `inventoryStore` | 3 | preserve-if-truthy no-op |
| `loreStore` | 3 | preserve-if-truthy no-op |
| `worldThreadStore` | 2 | preserve-if-truthy no-op (drops one stale key) |
| `npcStore` | 2 | preserve-if-truthy no-op |
| `goalStore` | 2 | preserve-if-truthy no-op |
| `narrativeStore` | 1 | none |
| `journalStore` | 1 | none |
| `navigationStore` | 1 | none |
| `providerStore` | 1 | none |

Six stores share `migrate: (persistedState) => persistedState || getInitialState()`. Read that literally: `persistedState` is only falsy when there was genuinely nothing in storage under that key — a first-time browser. For every returning user, `persistedState` is a real (truthy) object, so this function hands it straight back **completely unchanged**. It doesn't reshape it, validate it, or reset it to the current default shape — it's a no-op for anyone with existing data. Bumping the version on one of these stores does not, by itself, clear or transform a single field for a returning user; the version comments on these stores say otherwise ("Incremented to clear old migrated data" — `characterStore.ts:753`, `inventoryStore.persistence.ts:22`), but that's not what the code does. If the intent really is a clean slate on upgrade, this pattern doesn't deliver it for anyone who already has data; it only produces a clean slate for someone who had nothing persisted in the first place. `characterStore.ts:761`, `loreStore.ts:38`, `npcStore.ts:236`, `goalStore.ts:394`, and `inventoryStore.persistence.ts:32` all use this exact line.

`worldStore` and `sessionStore` are the only two stores that actually branch on the version number to transform specific fields — they're the real migrations in this codebase. Everything else is either a no-op or (for four stores) has no `migrate` function at all. Those two are the worked examples below.

## How a migration function is written and registered

There's no separate registration step — `migrate` is just a field on the `PersistOptions` object passed to `persist()`, sitting next to `name`, `storage`, and `version`. Some stores inline the whole `persist()` config in the store file (`worldStore.ts`, `characterStore.ts`); a few pull it into a sibling `*.persistence.ts` file that exports a typed `PersistOptions` object (`narrativeStore.persistence.ts`, `inventoryStore.persistence.ts`) and import that into the store. Either way, the shape is the same:

```typescript
persist(
  (set, get) => ({ /* store actions and initial state */ }),
  {
    name: 'narraitor-world-store',
    storage: createIndexedDBStorage(),
    version: 5,
    migrate: (persistedState: unknown, version?: number) => {
      // transform persistedState based on version, return the new shape
    },
  }
)
```

`createIndexedDBStorage()` (`src/state/persistence.ts:49-82`) is what most persisted stores pass as `storage` — it wraps `ResilientStorageMiddleware` (falls back to an in-memory `Map` if IndexedDB isn't available) and does `JSON.stringify`/`JSON.parse` on the `{state, version}` envelope Zustand hands it. It's not universal, though: `navigationStore.ts` doesn't set `storage` at all, so it falls through to Zustand's own default (`localStorage`, via `createJSONStorage`), and `providerStore.ts` uses a separate adapter, `createProviderStorage()` (`src/lib/storage/providerStorage.ts`), which tries IndexedDB first and falls back to `localStorage` rather than memory — different fallback semantics because provider config (which model, which key) needs to survive a refresh, unlike game state. None of the three adapters carry migration logic of their own; migration is entirely the `migrate` function's job, per store, regardless of which storage backend it's paired with.

## Worked example: sessionStore's tutorialProgress migration

`sessionStore.ts:687-722` is the fullest example in the tree — two version-gated branches plus a try/catch fallback:

```typescript
migrate: (persistedState: unknown, version?: number) => {
  try {
    const nextState = persistedState as Partial<SessionStore>;

    // Migration from v2 to v3: Add tutorialProgress
    // CLEAN BREAK: No backward compatibility - all users get fresh tutorial state
    if (typeof version === 'number' && version < 3) {
      nextState.tutorialProgress = {
        phases: { /* ... fresh default phases ... */ },
        dismissedHints: [],
        lastActiveStep: null,
      };
      delete (nextState as Partial<SessionStore> & { onboardingCompleted?: boolean }).onboardingCompleted;
    }

    // Migration from v3 to v4: Add worldGeneration phase
    if (typeof version === 'number' && version < 4 && nextState.tutorialProgress) {
      nextState.tutorialProgress.phases = {
        ...nextState.tutorialProgress.phases,
        worldGeneration: { completed: false, skipped: false, lastStep: 0 }
      };
    }

    return nextState;
  } catch (error) {
    logger.error('State migration failed', error);
    return initialState;
  }
},
```

Two things worth calling out about the shape:

- Each `if (version < N)` block is additive and cumulative — a browser still holding v2 data runs both blocks in sequence and lands on v4 shape in one hydration pass. A browser on v3 skips the first block and only runs the second. This is the pattern for "add a field, don't touch what's already there."
- The `try/catch` is `sessionStore`'s own choice, not something Zustand provides. If `migrate` throws and isn't caught, the promise chain inside Zustand's `persist` middleware rejects and the `postRehydrationCallback` gets called with an error instead of state (see `onRehydrateStorage` on the affected store, if it checks for one) — the store's in-memory state stays whatever `create()` initialized it to. `worldStore`'s migrate (below) has no try/catch, so a thrown error there isn't handled at all.

`worldStore.ts:518-558` is the other real example, and it's the one with actual nested-object surgery instead of just adding a top-level field:

```typescript
migrate: (persistedState: unknown, version?: number) => {
  let nextState = persistedState;

  if (!nextState) {
    nextState = { worlds: {}, entities: {}, worldStates: {}, /* ... */ };
  }

  if (typeof version === 'number' && version < 4) {
    const worldStates = (nextState as { worldStates?: Record<EntityID, WorldState> }).worldStates;
    if (worldStates && typeof worldStates === 'object') {
      Object.values(worldStates).forEach((state) => {
        if (state && !Array.isArray(state.storyCheckpoints)) {
          state.storyCheckpoints = [];
        }
      });
    }
  }

  // Migration from v4 to v5: Clean start, remove old cumulative-summary checkpoints
  if (typeof version === 'number' && version < 5) {
    const worldStates = (nextState as { worldStates?: Record<EntityID, WorldState> }).worldStates;
    if (worldStates && typeof worldStates === 'object') {
      Object.values(worldStates).forEach((state) => {
        if (state && Array.isArray(state.storyCheckpoints)) {
          state.storyCheckpoints = [];
        }
      });
    }
  }

  return nextState;
},
```

This is why `worldStore` needs an explicit migrate step at all, rather than relying on Zustand's default merge behavior (next section): `storyCheckpoints` lives nested inside `worldStates[worldId]`, one level down from the top of the persisted object. Zustand's default `merge` only backfills missing keys at the top level, so a brand-new top-level field on a store would show up with its default value automatically after a version bump even with a no-op `migrate` — but a new or reshaped field nested inside an existing object, like this one, won't. Anything below the top level has to be walked and fixed by hand, which is what both loops above do.

## Hydration order

There's no coordinator that hydrates stores in a fixed sequence. Each store's `persist` middleware kicks off its own async `getItem()` call against IndexedDB independently, as soon as the module that calls `create()` is evaluated — `worldStore`, `characterStore`, `sessionStore`, and the rest all hydrate in parallel, on their own timeline, each running its own `migrate` if its stored version doesn't match.

Because of that, any code that needs more than one store's persisted data to be in place has to explicitly wait. The pattern used across the app (`src/app/play/page.tsx:47-79`, `src/components/Landing/ReturningUserRedirect.tsx:44-79`) is to poll `store.persist.hasHydrated()` on each store involved and, for the ones still pending, subscribe via `store.persist.onFinishHydration(callback)`:

```typescript
const persists = [getPersist(useWorldStore), getPersist(useCharacterStore), getPersist(useSessionStore)];
const allHydrated = persists.every(p => p?.hasHydrated?.() ?? true);
if (allHydrated) { /* proceed */ } else {
  // subscribe to onFinishHydration for each pending store, proceed once all report in
}
```

Reading a persisted store's state before its own hydration (and migration) has finished means reading whatever `create()` initialized it to, not the migrated data — that's the race `play/page.tsx`'s comment calls out directly ("Reading pre-hydration causes a redirect race"). This isn't only a multi-store problem: `src/components/ai/ProviderGate.tsx:20-24` waits on `useProviderStore.persist.hasHydrated()` alone, a single store, for exactly the same reason — an imperative read (`getState()`, or a value captured in an effect on mount) taken before that one store finishes hydrating is stale regardless of how many other stores are involved. A component reading a persisted value straight from the normal `useXStore(state => state.y)` hook doesn't need this dance, since React re-renders it once `set()` fires after hydration; the wait pattern only matters for code that reads state imperatively, outside that subscription, before hydration is known to be done.

## What happens when the stored version differs from the code's version

Zustand's `persist` middleware (v5.0.8, `zustand/middleware`) compares the version number saved in IndexedDB against the store's `version` option using strict inequality — `deserializedStorageValue.version !== options.version` — not a "less than" check. That comparison doesn't know or care whether the stored version is older or newer than what the running code expects; it only fires `migrate` when the two numbers don't match, in either direction.

That has two consequences worth being explicit about, because neither is handled specially anywhere in this codebase:

- **Older stored version**: this is the case every `migrate` function in the table above is actually written for. The version-gated stores (`worldStore`, `sessionStore`) check `version < N` for each transformation, which only ever evaluates true when the stored version is older. The preserve-if-truthy stores don't check the version at all — they just decide whether to keep or discard based on truthiness.
- **Newer stored version** (e.g. a user ran a newer build, then the app got rolled back to an older one): the same `migrate` function still runs, because the versions still don't match — but "the same migrate function" now means whatever the *older, rolled-back* code actually contains, which may not even have the later `version < N` branch yet. For `worldStore`/`sessionStore`, an older build's `version < N` checks were written only to backfill older data; they were never written to reconcile a newer, unfamiliar shape, so a newer object just passes through untouched — not because that's verified safe, but because nothing in the function looks at fields it doesn't know about. Whether that's actually harmless depends entirely on whether the newer shape conflicts with what the older code expects, and nothing checks that. Worse, `persist` re-writes storage after every migrate call (see below), so the rolled-back build re-persists that data under *its own*, older version number — meaning the next time the app is upgraded again, the same `version < N` branches fire a second time on data that was already in the newer shape once before. Nothing in the tree tests that double-migration case. For the preserve-if-truthy stores, a newer stored version is treated exactly like an older one: handed back unchanged, since the function never inspects the version at all. **There's no code anywhere that distinguishes "newer" from "older" and reacts differently to protect a rollback** — this doc is describing what the existing checks happen to do, not a designed rollback path.

A third case matters more in practice: **no `migrate` function at all** (`narrativeStore`, `journalStore`, `navigationStore`, `providerStore`, all still at their original version). If one of those stores' version is ever bumped without adding a `migrate` function in the same change, Zustand logs `console.error('State loaded from storage couldn't be migrated since no migrate function was provided')` and treats the load as if nothing were persisted — the store falls back to whatever `create()` initializes it to. There's no user-facing error, no fallback file, no recovery path; it's a silent data loss with only a console log as evidence. This is the sharpest gap in the current setup: it's not that migrations are hard, it's that four stores have no migration path in place yet and will hit exactly this if their next change happens to need a version bump.

One recovery mechanism does exist implicitly: once `migrate` runs and returns a result, Zustand immediately re-persists that result under the new version number. So a successful migration is self-correcting after the first load — the second hydration of that browser session finds the version already matching and skips `migrate` entirely.

## Testing a migration

There's no test harness or fixture set for this — the pattern used in the tree is to reach into the store's own persist config and call `migrate` directly with a hand-built object standing in for old IndexedDB data:

```typescript
const migrate = (useSessionStore as any).persist.getOptions().migrate;

const v2State = { onboardingCompleted: true, someOtherField: 'value' };
const migratedState = migrate(v2State, 2) as any;

expect(migratedState.onboardingCompleted).toBeUndefined(); // removed
expect(migratedState.tutorialProgress.phases.intro.completed).toBe(false); // added, clean-break default
expect(migratedState.someOtherField).toBe('value'); // untouched fields survive
```

That's the real test, from `src/state/__tests__/sessionStore.tutorial.test.ts:96-117`. It never touches IndexedDB or the storage adapter — it's a plain unit test of the pure function, called with the version number a real stored record would have carried. `src/state/__tests__/worldThreadStore.test.ts:179-186` and `src/state/__tests__/worldDeletionCascade.test.ts:91-100` (testing `loreStore`'s preserve-if-truthy migrate) follow the same shape.

**Gap**: `worldStore`'s own migrate function — the one with the nested `storyCheckpoints` transformation above — has no test like this anywhere in the tree. It's exercised only indirectly, if at all, by whatever integration tests happen to load persisted world data. Given it's the migrate function doing the most structurally interesting work (nested-object mutation across two version boundaries), that's the one most worth writing a direct test for using the pattern above.

## Other gaps in the current implementation

- **No validation of migrated output.** None of the `migrate` functions check that the shape they're returning actually matches what the store's types expect — they trust the input and trust their own transformation. A migration that silently produces a malformed object flows straight into `set()` with no schema check in between.
- **The preserve-if-truthy pattern's version-bump comments overstate what the code does** (see "The versioning scheme today" above) — worth flagging again here because it's the kind of thing that looks fine in code review (the comment reads as intentional) and only bites when someone relies on it during an actual schema-breaking change.
- **No multi-version-jump test coverage.** `sessionStore`'s migrate is written to handle a browser jumping straight from v2 to v4 in one hydration (both `if` blocks run), but nothing in the test file exercises that combined case — the two existing tests both start from a v2 fixture and check the fields land right, without asserting both branches actually fired together.

## Related documentation

- [ADR-004: IndexedDB for client-side persistence](../architecture/ADR-004-indexeddb-persistence.md) — why IndexedDB, and the adapter this migration strategy sits on top of.
- [Storage Resilience Guide](storage-resilience-guide.md) — what happens when IndexedDB itself is unavailable or fails, as opposed to when the stored shape is out of date.
- [State Management Usage](state-management-usage.md) — the full list of domain stores and general Zustand patterns this doc assumes.
