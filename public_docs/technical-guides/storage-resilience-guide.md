# Storage Resilience Guide

This system exists because browser storage is unreliable - users would hit storage quota limits, run into private browsing restrictions, or just have IndexedDB randomly fail. The game needs to keep working even when persistence breaks.

## What It Does

When storage fails, the system automatically:
- Retries with exponential backoff (1s, 2s, 4s delays)
- Falls back to memory storage so the game continues
- Detects when storage recovers and switches back
- Provides clear status so users know what's happening

The key insight: keep the game playable even if saving progress fails.

## How It Works

The `ResilientStorageMiddleware` wraps IndexedDB and handles all the failure scenarios:

```typescript
// Just use it normally - failures are handled automatically
await storage.setItem('worlds', worldData);
const data = await storage.getItem('worlds');

// Check status if you need to show user feedback
const status = storage.getStorageStatus(); // 'healthy' | 'degraded' | 'unavailable'
```

## Common Failure Scenarios

**Storage quota exceeded**: Retries with cleanup, falls back to memory if needed

**Private browsing mode**: Detects and switches to memory-only mode immediately

**Temporary failures**: Retries then recovers automatically when storage comes back

**Corruption**: Clears corrupted data and starts fresh (better than crashing)

## For Developers

The Zustand stores already use this through `createIndexedDBStorage()`. No special setup needed - just handle the storage status if user feedback about persistence issues is needed.

The implementation details are in `src/lib/storage/resilientStorage.ts`.

## Inventory Persistence Contract

Inventory persistence used to lean on a guard that rebuilt character inventories whenever a legacy object shape showed up. That kept players unblocked, but it also hid data loss. The store now treats those legacy object-shaped payloads as invalid and empties just the offending entries instead of silently rebuilding them, which means engineers get cleaner telemetry and players stop wondering why items disappeared.

Quick references for what changed:
- `narraitor-inventory-store` runs at schema version `3`, but migration is non-destructive: `migrate` returns the persisted state untouched and only falls back to an empty store when nothing is persisted at all (`persistedState || getInitialState()`). Old saves are kept, not dropped.
- Character inventories must stay `Record<EntityID, EntityID[]>`. Hydration strips non-array values and prunes bad entries, logging through the `InventoryPersistence` channel so it is obvious when the guard steps in.
- Cleanup is lazy, not a one-shot reset. `sanitizeInventoryValue` empties non-array `characterInventories` entries and drops non-string/empty IDs at access time, logging each cleanup through the `InventoryPersistence` channel (message "Inventory guard sanitized payload"). There's no `schema-reset` log and no version-keyed wipe — with `NEXT_PUBLIC_DEBUG_LOGGING=true` you'll see the per-entry sanitization events instead.
- Runtime access to `characterInventories` still runs through the sanitizer, so even freshly corrupted values disappear immediately instead of leaking into gameplay.

### QA Playbook: Inventory Reset

Whether you are double-checking the migration or investigating a report, follow the same loop. Seed a stale payload by writing an object-shaped `characterInventories` field into the `narraitor-inventory-store` entry (any export from before February 2025 works). Reload the app and confirm the `InventoryPersistence` "Inventory guard sanitized payload" log appears as the object-shaped entry is emptied. Add a new item, reload again, and verify IndexedDB only stores string IDs with no additional logs. To spot-check the guard, edit one entry to include a bad value such as a number, reload once more, and watch a single sanitization event show up as the bad value disappears.
