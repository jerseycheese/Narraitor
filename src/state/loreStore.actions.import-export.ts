import type { EntityID } from '../types/common.types';
import {
  exportFactsImpl,
  importFactsImpl,
  type ImportExportContext,
} from './loreStore.import-export';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreImportExportActions = (
  set: SetState,
  get: GetState
) => ({
  exportFacts: (worldId: EntityID) => {
    const context: ImportExportContext = {
      getFacts: get().getFacts,
      addFact: get().addFact,
      validateFactUniqueness: get().validateFactUniqueness,
      setAliases: get().setAliases,
      setError: (error) => set({ error }),
    };
    return exportFactsImpl(worldId, context);
  },

  importFacts: (worldId: EntityID, jsonData: string) => {
    const context: ImportExportContext = {
      getFacts: get().getFacts,
      addFact: get().addFact,
      validateFactUniqueness: get().validateFactUniqueness,
      setAliases: get().setAliases,
      setError: (error) => set({ error }),
    };
    importFactsImpl(worldId, jsonData, context);
  },
});
