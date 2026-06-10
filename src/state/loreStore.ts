import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from './persistence';
import { getInitialState } from './loreStore.state';
import {
  createLoreBaseActions,
  createLoreFactActions,
  createLoreAliasActions,
  createLoreUsageActions,
  createLoreImportExportActions,
} from './loreStore.actions';
// The interface lives in loreStore.types.ts so action factories can type
// against it without importing this module (which would be a cycle).
import type { LoreStore } from './loreStore.types';
export type { LoreStore } from './loreStore.types';

export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      ...createLoreBaseActions(set, get),
      ...createLoreFactActions(set, get),
      ...createLoreAliasActions(set, get),
      ...createLoreImportExportActions(set, get),
      ...createLoreUsageActions(set, get),
      getMergeAuditLog: () => get().mergeAuditLog,
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      version: 3,
      partialize: (state) => ({
        facts: state.facts,
        factHistory: state.factHistory,
        mergeAuditLog: state.mergeAuditLog,
      }),
      migrate: () => getInitialState(),
    }
  )
);
