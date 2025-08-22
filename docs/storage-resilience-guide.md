# Storage Resilience Guide

I built this system because browser storage is unreliable - users would hit storage quota limits, run into private browsing restrictions, or just have IndexedDB randomly fail. The game needs to keep working even when persistence breaks.

## What It Does

When storage fails, the system automatically:
- Retries with exponential backoff (1s, 2s, 4s delays)
- Falls back to memory storage so the game continues
- Detects when storage recovers and switches back
- Provides clear status so users know what's happening

The key insight: keep the game playable even if we can't save progress.

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

The Zustand stores already use this through `createIndexedDBStorage()`. You don't need to do anything special - just handle the storage status if you want to show user feedback about persistence issues.

Check `src/lib/storage/resilientStorage.ts` for implementation details.
