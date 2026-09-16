import type { PersistOptions } from 'zustand/middleware';
import { createIndexedDBStorage, createPreserveMigrate } from './persistence';
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
  version: 3,
  partialize: (state) => ({
    items: state.items,
    entities: state.entities,
    characterInventories: state.characterInventories,
  }),
  migrate: createPreserveMigrate<PersistedInventoryState>(getInitialState),
};
