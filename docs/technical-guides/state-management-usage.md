---
title: State Management Usage Guide
aliases: [State Management, Zustand Usage]
tags: [narraitor, documentation, technical-guide, state-management]
created: 2025-05-13
updated: 2025-05-13
---

# State Management Usage Guide

This guide provides practical examples for using the Narraitor state management system, which is built with Zustand.

## Overview

The Narraitor application uses Zustand for state management, organized into domain-specific stores. Each domain (World, Character, Inventory, etc.) has its own store that manages related state.

## MVP Implementation Status

The current implementation includes:
- Basic store initialization with default values
- TypeScript type definitions for all stores
- IndexedDB persistence configuration (not yet integrated)
- Unit tests for store initialization

What's NOT included (out of MVP scope):
- Complex state actions and mutations
- Cross-domain state interactions
- Actual persistence implementation
- Advanced features like time-travel debugging

## Available Stores

| Store | Purpose | Type |
|-------|---------|------|
| `worldStore` | Manages world configurations | `World` |
| `characterStore` | Manages character data | `Character` |
| `inventoryStore` | Manages inventory state | `Inventory` |
| `narrativeStore` | Manages narrative segments | `{ segments: NarrativeSegment[] }` |
| `journalStore` | Manages journal entries | `{ entries: JournalEntry[] }` |
| `sessionStore` | Manages game sessions | `GameSession` |
| `aiContextStore` | Manages AI context data | `AIContext` |

## Basic Usage

### Importing Stores

```typescript
import { 
  worldStore, 
  characterStore, 
  inventoryStore,
  narrativeStore,
  journalStore,
  sessionStore,
  aiContextStore
} from '@/state';
```

### Accessing State

```typescript
// Get current state
const worldState = worldStore.getState();
const characterState = characterStore.getState();

// Use in React components
function MyComponent() {
  const world = worldStore();
  const character = characterStore();
  
  return (
    <div>
      <h1>{world.name}</h1>
      <p>{character.name}</p>
    </div>
  );
}
```

### Subscribing to Changes

```typescript
// Subscribe to state changes
const unsubscribe = worldStore.subscribe(
  (state) => {
    console.log('World state changed:', state);
  }
);

// Clean up subscription
unsubscribe();
```

## Testing Pattern

The current test pattern verifies store initialization:

```typescript
import { characterStore } from '../index';

describe('characterStore', () => {
  it('initializes with default state', () => {
    const state = characterStore.getState();
    expect(state).toBeDefined();
    expect(state.id).toBe('');
    expect(state.name).toBe('');
    // ... other assertions
  });
});
```

## Persistence Configuration

The persistence configuration is defined in `persistence.ts`:

```typescript
export const persistConfig = { name: 'narraitor-state' };
```

This configuration is intended for future integration with IndexedDB middleware.

## TypeScript Support

All stores are fully typed using the domain types from `@/types`:

```typescript
// Example: Using typed state
const character: Character = characterStore.getState();

// Type-safe access to properties
const characterName: string = character.name;
const attributes: CharacterAttribute[] = character.attributes;
```

## Future Enhancements

The following features are planned for post-MVP implementation:
- State actions (create, update, delete operations)
- Persistence middleware integration
- Cross-store selectors
- Computed state values
- State validation

## Best Practices

1. **Access state directly**: For MVP, access state properties directly from stores
2. **Use TypeScript**: Leverage type definitions for type safety
3. **Keep it simple**: MVP implementation focuses on basic state management
4. **Test initialization**: Ensure stores initialize with correct default values

## Examples

### Accessing World Data

```typescript
import { worldStore } from '@/state';

function WorldInfo() {
  const world = worldStore();
  
  return (
    <div>
      <h2>{world.name || 'No World Selected'}</h2>
      <p>Theme: {world.theme || 'None'}</p>
      <p>Created: {world.createdAt}</p>
    </div>
  );
}
```

### Accessing Character Inventory

```typescript
import { characterStore, inventoryStore } from '@/state';

function CharacterInventory() {
  const character = characterStore();
  const inventory = inventoryStore();
  
  return (
    <div>
      <h3>{character.name}'s Inventory</h3>
      <p>Items: {inventory.items.length}</p>
      <p>Capacity: {inventory.capacity}</p>
    </div>
  );
}
```

### Working with Journal Entries

```typescript
import { journalStore } from '@/state';

function JournalViewer() {
  const { entries } = journalStore();
  
  return (
    <div>
      <h3>Journal Entries</h3>
      <p>Total Entries: {entries.length}</p>
      {entries.map((entry, index) => (
        <div key={index}>
          {/* Render entry content */}
        </div>
      ))}
    </div>
  );
}
```

## Limitations (MVP Scope)

- Stores only contain initial state without modification capabilities
- No persistence implementation (configuration only)
- No complex state derivation or computed values
- No middleware integration
- No state action creators

For more advanced state management features, these will be implemented in future development phases as outlined in the project roadmap.
