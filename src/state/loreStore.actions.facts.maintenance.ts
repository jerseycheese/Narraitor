import {
  cleanupOldFactsImpl,
  compactFactHistoryImpl,
  type LoreUtilsContext,
} from './loreStore.utils';
import type { EntityID } from '../types/common.types';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreFactMaintenanceActions = (set: SetState, get: GetState) => ({
  cleanupOldFacts: (worldId: EntityID, keepRecentCount = 50) => {
    const context: LoreUtilsContext = {
      getFacts: () => get().facts,
      getFactHistory: () => get().factHistory,
      setStore: (updates) => set((state) => ({ ...state, ...updates })),
    };
    cleanupOldFactsImpl(worldId, keepRecentCount, context);
  },

  compactFactHistory: (maxVersionsPerFact = 3) => {
    const context: LoreUtilsContext = {
      getFacts: () => get().facts,
      getFactHistory: () => get().factHistory,
      setStore: (updates) => set((state) => ({ ...state, ...updates })),
    };
    compactFactHistoryImpl(maxVersionsPerFact, context);
  },
});
