# StateInspector Usage Examples

This document provides practical examples for using the StateInspector utilities for debugging and development.

## Basic Setup

```typescript
import { stateInspector } from '@/lib/utils/stateInspector';
import { worldStore, characterStore, inventoryStore } from '@/state';

// Register stores for inspection
stateInspector.registerStores({
  worldStore,
  characterStore,
  inventoryStore
});
```

## Getting State Snapshots

```typescript
// Capture complete state snapshot
const snapshot = stateInspector.getStateSnapshot();
console.log(`Captured ${snapshot.metadata.totalStores} stores with ${snapshot.metadata.totalPaths} paths`);

// Check for performance warnings
if (snapshot.metadata.performanceWarnings.length > 0) {
  console.warn('Performance warnings:', snapshot.metadata.performanceWarnings);
}

// Access specific store states
const worldState = snapshot.storeStates.worldStore;
const characterState = snapshot.storeStates.characterStore;
```

## Hierarchical Navigation

```typescript
// Navigate to specific paths
const currentWorld = stateInspector.getValueAtPath('worldStore.entities.world-1');
const worldName = stateInspector.getValueAtPath('worldStore.entities.world-1.name');
const allCharacters = stateInspector.getValueAtPath('characterStore.entities');

// Get path metadata
const pathInfo = stateInspector.getPathMetadata('worldStore.entities');
console.log(`Path type: ${pathInfo.type}, has children: ${pathInfo.hasChildren}`);

// Explore child paths
if (pathInfo.hasChildren) {
  const children = stateInspector.getChildPaths('worldStore.entities');
  console.log('Available worlds:', children);
}
```

## Monitoring State Changes

```typescript
// Watch for changes to current world
const worldSubscription = stateInspector.watchPath(
  'worldStore.currentWorldId',
  (oldValue, newValue, path) => {
    console.log(`Active world changed from ${oldValue} to ${newValue}`);
    
    // React to world changes
    if (newValue) {
      loadWorldData(newValue as string);
    }
  }
);

// Watch character selection
const characterSubscription = stateInspector.watchPath(
  'characterStore.currentCharacterId',
  (oldValue, newValue, path) => {
    console.log(`Selected character changed: ${newValue}`);
  }
);

// Clean up watchers when done
worldSubscription.unsubscribe();
characterSubscription.unsubscribe();
```

## Advanced Monitoring Patterns

```typescript
// Monitor multiple related paths
const watchedPaths = [
  'worldStore.currentWorldId',
  'characterStore.currentCharacterId',
  'inventoryStore.selectedItems'
];

const subscriptions = watchedPaths.map(path => 
  stateInspector.watchPath(path, (oldValue, newValue, changedPath) => {
    // Centralized change handler
    handleStateChange(changedPath, oldValue, newValue);
  })
);

// Cleanup function
const cleanup = () => {
  subscriptions.forEach(sub => sub.unsubscribe());
  stateInspector.clearAllWatchers();
};

// Monitor complex object changes
stateInspector.watchPath('worldStore.entities', (oldWorlds, newWorlds) => {
  const oldWorldIds = Object.keys(oldWorlds as Record<string, unknown> || {});
  const newWorldIds = Object.keys(newWorlds as Record<string, unknown> || {});
  
  // Detect added worlds
  const addedWorlds = newWorldIds.filter(id => !oldWorldIds.includes(id));
  if (addedWorlds.length > 0) {
    console.log('New worlds added:', addedWorlds);
  }
  
  // Detect removed worlds
  const removedWorlds = oldWorldIds.filter(id => !newWorldIds.includes(id));
  if (removedWorlds.length > 0) {
    console.log('Worlds removed:', removedWorlds);
  }
});
```

## Component Integration

```tsx
import React, { useEffect, useState } from 'react';
import { stateInspector } from '@/lib/utils/stateInspector';

function DebuggingPanel() {
  const [watchedValues, setWatchedValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Setup watchers for key application state
    const subscriptions = [
      stateInspector.watchPath('worldStore.currentWorldId', (old, current) => {
        setWatchedValues(prev => ({ ...prev, currentWorld: current }));
      }),
      
      stateInspector.watchPath('characterStore.entities', (old, current) => {
        setWatchedValues(prev => ({ 
          ...prev, 
          characterCount: Object.keys(current as Record<string, unknown> || {}).length 
        }));
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  return (
    <div>
      <h3>Application State Monitor</h3>
      <ul>
        {Object.entries(watchedValues).map(([key, value]) => (
          <li key={key}>
            {key}: {JSON.stringify(value)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Performance Monitoring

```typescript
// Monitor StateInspector performance
function monitorPerformance() {
  const startTime = performance.now();
  
  const snapshot = stateInspector.getStateSnapshot();
  
  const endTime = performance.now();
  console.log(`Snapshot took ${endTime - startTime}ms`);
  
  // Check watcher count
  const watcherCount = stateInspector.getWatchCount();
  if (watcherCount > 20) {
    console.warn(`High watcher count: ${watcherCount}. Consider cleanup.`);
  }
  
  return snapshot;
}

// Periodic performance check
setInterval(() => {
  if (process.env.NODE_ENV === 'development') {
    monitorPerformance();
  }
}, 30000); // Every 30 seconds
```

## Error Handling

```typescript
// Safe path access with error handling
function safeGetValue(path: string): unknown {
  try {
    const value = stateInspector.getValueAtPath(path);
    if (value === undefined) {
      console.warn(`Path not found: ${path}`);
    }
    return value;
  } catch (error) {
    console.error(`Error accessing path ${path}:`, error);
    return null;
  }
}

// Safe watcher setup with cleanup
function setupSafeWatcher(path: string, callback: (old: unknown, current: unknown) => void) {
  try {
    const subscription = stateInspector.watchPath(path, (oldValue, newValue, watchPath) => {
      try {
        callback(oldValue, newValue);
      } catch (error) {
        console.error(`Error in watcher callback for ${watchPath}:`, error);
      }
    });

    return subscription;
  } catch (error) {
    console.error(`Failed to setup watcher for ${path}:`, error);
    return { unsubscribe: () => {} };
  }
}
```

## Testing Utilities

```typescript
// Test helper for mocking StateInspector
export function createMockStateInspector() {
  return {
    registerStores: jest.fn(),
    getStateSnapshot: jest.fn(() => ({
      timestamp: Date.now(),
      storeStates: {
        worldStore: { currentWorldId: 'test-world' },
        characterStore: { currentCharacterId: 'test-character' }
      },
      metadata: {
        totalStores: 2,
        totalPaths: 10,
        performanceWarnings: []
      }
    })),
    getValueAtPath: jest.fn(),
    getPathMetadata: jest.fn(() => ({
      path: 'test.path',
      value: 'test-value',
      type: 'string',
      depth: 1,
      hasChildren: false,
      isCircular: false
    })),
    getChildPaths: jest.fn(() => []),
    watchPath: jest.fn(() => ({ unsubscribe: jest.fn() })),
    getWatchCount: jest.fn(() => 0),
    clearAllWatchers: jest.fn()
  };
}

// Integration test example
describe('StateInspector Integration', () => {
  beforeEach(() => {
    stateInspector.clearAllWatchers();
  });

  it('should track world changes', async () => {
    const changes: string[] = [];
    
    const subscription = stateInspector.watchPath(
      'worldStore.currentWorldId',
      (old, current) => {
        changes.push(`${old} -> ${current}`);
      }
    );

    // Simulate world change
    worldStore.getState().setCurrentWorld('new-world-id');
    
    // Wait for change detection
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(changes).toContain('old-world -> new-world-id');
    
    subscription.unsubscribe();
  });
});
```

## Best Practices

1. **Always clean up watchers** when components unmount or when no longer needed
2. **Use specific paths** rather than watching root objects for better performance
3. **Limit the number of concurrent watchers** to prevent memory leaks
4. **Check performance warnings** in the snapshot metadata
5. **Handle errors gracefully** when accessing potentially undefined paths
6. **Use development-only guards** to prevent production overhead

```typescript
// Good: Specific path watching
stateInspector.watchPath('worldStore.currentWorldId', callback);

// Avoid: Watching entire objects
stateInspector.watchPath('worldStore', callback); // Can be expensive

// Good: Development guard
if (process.env.NODE_ENV === 'development') {
  stateInspector.registerStores(stores);
}
```