import type { LoreCategory, LoreMergeAuditEntry, EntityMatch } from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import type { DuplicateMatch } from '../types/lore.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import {
  scanForDuplicatesImpl,
  mergeFactsImpl,
  checkDuplicateBeforeCreateImpl,
  type DeduplicationContext,
} from './loreStore.deduplication';
import {
  updateEntityReferencesImpl,
  findPotentialEntityMatchesImpl,
  type ReferenceUpdateContext,
} from './loreStore.resolution';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreFactDeduplicationActions = (
  set: SetState,
  get: GetState
) => ({
  scanForDuplicates: async (worldId: EntityID, category?: LoreCategory) => {
    const context: DeduplicationContext = {
      getFact: get().getById,
      getFacts: get().getFacts,
      updateFact: get().update,
      deleteFact: get().delete,
      setAliases: get().setAliases,
      setError: get().setError,
    };
    return await scanForDuplicatesImpl(worldId, category ?? null, context);
  },

  mergeFacts: (primaryId: EntityID, secondaryId: EntityID) => {
    const dedupeContext: DeduplicationContext = {
      getFact: get().getById,
      getFacts: get().getFacts,
      updateFact: get().update,
      deleteFact: get().delete,
      setAliases: get().setAliases,
      setError: get().setError,
    };
    const result = mergeFactsImpl(primaryId, secondaryId, dedupeContext);

    const referenceContext: ReferenceUpdateContext = {
      getFacts: get().getFacts,
      updateFact: get().update,
    };

    const referencesUpdated = updateEntityReferencesImpl(
      result.worldId,
      [result.secondaryName, ...result.secondaryAliases],
      result.primaryName,
      referenceContext
    );

    const auditEntry: LoreMergeAuditEntry = {
      id: generateUniqueId('merge'),
      worldId: result.worldId,
      primaryId: result.primaryId,
      secondaryId: result.secondaryId,
      primaryName: result.primaryName,
      secondaryName: result.secondaryName,
      primaryCategory: result.primaryCategory,
      secondaryCategory: result.secondaryCategory,
      timestamp: getTimestamp(),
      referencesUpdated,
      aliasesAdded: result.aliasesAdded,
      crossCategory: result.crossCategory,
    };

    set((state) => ({
      mergeAuditLog: [auditEntry, ...state.mergeAuditLog],
    }));
  },

  checkDuplicateBeforeCreate: async (
    value: string,
    category: LoreCategory,
    worldId: EntityID
  ): Promise<DuplicateMatch[]> => {
    const context: DeduplicationContext = {
      getFact: get().getById,
      getFacts: get().getFacts,
      updateFact: get().update,
      deleteFact: get().delete,
      setAliases: get().setAliases,
      setError: get().setError,
    };
    return await checkDuplicateBeforeCreateImpl(value, category, worldId, context);
  },

  findPotentialEntityMatches: (
    worldId: EntityID,
    options?: { minConfidence?: number; category?: LoreCategory }
  ): EntityMatch[] =>
    findPotentialEntityMatchesImpl(worldId, { getFacts: get().getFacts }, options),
});
