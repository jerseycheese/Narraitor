import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  storeEvents,
  StoreEventTypes,
  type CharacterDeletedEvent,
  type SessionFreshStartEvent,
} from '@/lib/state/storePubSub';
import type { InventoryStore } from './inventoryStore.types';
import { getInitialState } from './inventoryStore.state';
import { createInventoryCrudActions } from './inventoryStore.actions';
import { createCharacterInventoryActions } from './inventoryStore.characterInventory';
import { createEquipmentActions } from './inventoryStore.equipment';
import { inventoryPersistOptions } from './inventoryStore.persistence';

import Logger from '@/lib/utils/logger';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';
const logger = new Logger('InventoryStore');

export type {
  InventoryStore,
  InventoryItemCreatePayload,
  InventoryItemAddPayload,
} from './inventoryStore.types';

// Inventory Store implementation with persistence. The store is composed
// from per-concern action factories (loreStore/narrativeStore precedent):
// - inventoryStore.actions.ts: core item CRUD + image generation tracking
// - inventoryStore.characterInventory.ts: add/remove/query a character's items
// - inventoryStore.equipment.ts: item usage + equip/unequip
// - inventoryStore.persistence.ts: IndexedDB persist options
export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      ...createInventoryCrudActions(set, get),
      ...createCharacterInventoryActions(set, get),
      ...createEquipmentActions(set, get),

      reset: () => set(getInitialState()),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),
    }),
    inventoryPersistOptions
  )
);

// Expose store globally in development for easier debugging & manual seeding
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useInventoryStore = useInventoryStore;
}

// Subscribe to store events
storeEvents.subscribe<CharacterDeletedEvent>(
  StoreEventTypes.CHARACTER_DELETED,
  ({ characterId }) => {
    useInventoryStore.getState().clearCharacterInventory(characterId);
  }
);

// Clear the character's inventory when a forced-fresh session starts.
// Subscribed here (rather than sessionStore importing this store) to keep
// sessionStore a leaf in the store import graph. Waits for persist hydration
// so the clear isn't overwritten by rehydrating stale data.
storeEvents.subscribe<SessionFreshStartEvent>(
  StoreEventTypes.SESSION_FRESH_START,
  ({ characterId, isForcedFresh }) => {
    if (!isForcedFresh) return;

    const clearInventory = () => {
      try {
        useInventoryStore.getState().clearCharacterInventory(characterId);
      } catch (clearError) {
        logger.warn('Failed to clear inventory for fresh session (during hydration callback):', clearError);
      }
    };

    const persistApi = (useInventoryStore as unknown as {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => () => void;
      };
    }).persist;

    if (persistApi?.hasHydrated?.()) {
      clearInventory();
    } else if (persistApi?.onFinishHydration) {
      persistApi.onFinishHydration(clearInventory);
    } else {
      clearInventory();
    }
  }
);
