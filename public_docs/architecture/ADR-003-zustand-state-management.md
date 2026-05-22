---
title: "ADR-003: Zustand domain stores for state management"
tags: [architecture, decision, adr, state, zustand]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-003: Zustand domain stores for state management

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of an inception-era decision, reconstructed from the
> codebase and git history.

## The Situation

Narraitor holds a lot of interrelated client state: worlds and their attributes/skills,
characters scoped to worlds, active narrative sessions, journal entries, lore, inventory, goals,
and navigation. It's local-first (see [ADR-002](ADR-002-client-side-only-architecture.md)), so
the client store *is* the source of truth, not a cache in front of a server. That state also has
to persist to IndexedDB and survive reloads.

React Context can technically hold all this, but a single context tree for state this broad
re-renders too much and gets unwieldy fast — a lesson carried over from the predecessor project.

## What We Decided

Use **Zustand, with one store per domain**. Each major area gets its own `useXStore` hook in
`src/state/` — `useWorldStore`, `useCharacterStore`, `useNarrativeStore`, `useJournalStore`,
`useSessionStore`, `useInventoryStore`, `useLoreStore`, `useGoalStore`, `useNPCStore`,
`useNavigationStore`, `useAiContextStore`. Stores are plain functions, selectable by slice, and
wrap their state in the `persist` middleware for IndexedDB.

## Why This Made Sense

Zustand is lightweight, has first-class TypeScript support, and — because a store is just a
function — it's trivial to read or drive imperatively from non-React code (services, the AI
layer, tests) via `getState()`. Splitting by domain keeps each store small and reasoned-about in
isolation, and selector subscriptions mean a change to inventory doesn't re-render the world
list.

The persistence story sealed it: Zustand's `persist` middleware drops cleanly onto an IndexedDB
adapter (see [ADR-004](ADR-004-indexeddb-persistence.md)), so "state that survives reloads" is a
per-store config flag rather than a separate sync system.

### What Else We Considered

- **React Context + useReducer**: no dependency, but it doesn't scale to this much state without
  excessive re-renders and a lot of provider boilerplate. This was effectively the "before"
  state being moved away from.
- **Redux Toolkit**: powerful and well-trodden, but heavier in boilerplate and ceremony than a
  solo project wants, and the imperative `getState()` ergonomics aren't as clean for the
  AI/services code that needs to read state outside React.
- **Jotai/Recoil (atomic state)**: a reasonable fit, but the domain-store mental model maps more
  directly onto the app's domains than a sea of atoms.

## What This Means Going Forward

### Upsides

- Domain stores are easy to test in isolation and easy to reason about.
- Reading/writing state from non-React code is clean (`useWorldStore.getState()`).
- Persistence is per-store configuration, not a separate system.

### Downsides

- Cross-store operations need care. Stores importing each other to coordinate creates circular
  dependencies — which is exactly why the `storePubSub` event bus exists for cascade deletes (a
  pattern worth its own future ADR).
- "One store per domain" can blur at the edges; `loreStore` grew big enough that it had to be
  split into a `loreStore.*` family.

## Implementation Notes

- Stores live in `src/state/`, exported as `useXStore` hooks; the shared CRUD shape is the
  `CrudStore<T>` type in `createCrudStore.ts`.
- Use selectors (`useWorldStore(s => s.worlds)`) so components only re-render on the slices they
  read.
- For cross-store cascades, publish through `storeEvents` (`src/lib/state/storePubSub.ts`) rather
  than importing one store into another.
- See the [State Management Guide](state-management-guide.md) and
  [state-stores technical guide](../technical-guides/state-stores.md).

## Related Decisions

- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md)
- [ADR-004: IndexedDB for client-side persistence](ADR-004-indexeddb-persistence.md)
