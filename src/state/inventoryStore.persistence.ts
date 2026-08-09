import type { PersistOptions } from 'zustand/middleware';
import { createIndexedDBStorage } from './persistence';
import { getInitialState } from './inventoryStore.state';
import type { InventoryStore } from './inventoryStore.types';

type PersistedInventoryState = Pick<
  InventoryStore,
  'items' | 'entities' | 'characterInventories'
>;

/**
 * Persist configuration for the inventory store. Moved out of
 * inventoryStore.ts verbatim — storage name, version, and (de)serialization
 * behavior must stay byte-identical to existing player data.
 */
export const inventoryPersistOptions: PersistOptions<
  InventoryStore,
  PersistedInventoryState
> = {
  name: 'narraitor-inventory-store',
  storage: createIndexedDBStorage(),
  version: 3, // Incremented to clear old migrated data
  partialize: (state) => ({
    items: state.items,
    entities: state.entities,
    characterInventories: state.characterInventories,
  }),
  // Preserve data, only clear if null. Cast is needed because persistedState
  // is `unknown` at this boundary — same runtime behavior as the inline
  // `migrate` used by loreStore/characterStore/goalStore/npcStore, just made
  // explicit now that this config has its own PersistOptions<T, U> type.
  migrate: (persistedState) =>
    (persistedState || getInitialState()) as PersistedInventoryState,
};
