---
title: "ADR-004: IndexedDB for client-side persistence"
tags: [architecture, decision, adr, persistence, indexeddb, storage]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-004: IndexedDB for client-side persistence

**Status**: Accepted
**Date**: 2025-04-28

> Backfilled 2026-05-22. Retroactive record of an inception-era decision, reconstructed from the
> codebase and git history.

## The Situation

Because Narraitor is client-side-only ([ADR-002](ADR-002-client-side-only-architecture.md)), the
browser is where saved games live. And saves get big: worlds with custom attributes and skills,
multiple characters, long narrative histories, accumulating lore and journal entries. All of it
has to survive a browser restart and be there when the player comes back.

The default reach for "store something in the browser" is `localStorage`, but it has hard limits
(a few MB, synchronous, strings only) that this data outgrows quickly.

## What We Decided

Persist to **IndexedDB**. The Zustand stores ([ADR-003](ADR-003-zustand-state-management.md))
wrap their state in the `persist` middleware pointed at a custom IndexedDB storage adapter,
`createIndexedDBStorage()` in `src/state/persistence.ts`. Each persisted store namespaces its
data under a key like `narraitor-character-store`.

## Why This Made Sense

IndexedDB is the browser's real database: it handles structured data, has far higher size limits
than `localStorage`, and its async API keeps large reads and writes off the main thread. For
narrative data that grows unbounded over a long campaign, that headroom matters — `localStorage`
would start throwing quota errors well before a serious playthrough finished.

Wrapping it behind Zustand's `persist` middleware means stores don't deal with storage mechanics
directly; they declare `storage: createIndexedDBStorage()` and a `name`, and persistence is
handled. The adapter also gives one place to centralize resilience (graceful fallback when
storage is unavailable) rather than scattering try/catch across stores.

### What Else We Considered

- **localStorage**: simplest API, but the size ceiling and synchronous, string-only nature make
  it unsuitable for the data volume. It survives only as an emergency fallback concept.
- **A wrapper library (Dexie, idb-keyval)**: would smooth IndexedDB's rough API, but a focused
  custom adapter that satisfies Zustand's `PersistStorage` interface keeps the dependency count
  down and the surface exactly as large as needed.
- **Remote/cloud storage**: ruled out by ADR-002 — there's no backend, and sync isn't a goal.

## What This Means Going Forward

### Upsides

- Saves scale with the story instead of hitting a quota wall.
- Async reads/writes keep large saves from janking the UI.
- One adapter centralizes the persistence and resilience logic.

### Downsides

- IndexedDB's native API is awkward; the adapter has to paper over it.
- Data is per-browser-profile (the ADR-002 trade-off): clearing site data or switching browsers
  loses saves, so the app needs explicit resilience and, eventually, export/import.
- Migrations are the store's responsibility — each persisted store defines a `migrate` step to
  handle older persisted shapes on load.

## Implementation Notes

- The adapter is `createIndexedDBStorage()` in `src/state/persistence.ts`; stores opt in via the
  `persist` middleware with a unique `name` and a `migrate` function.
- When changing a persisted store's shape, update its `migrate` so existing saves don't break.
- See the [storage-resilience guide](../technical-guides/storage-resilience-guide.md) for the
  fallback behavior.

## Related Decisions

- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md)
- [ADR-003: Zustand domain stores](ADR-003-zustand-state-management.md)
