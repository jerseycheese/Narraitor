import type { LoreSearchOptions, LoreCategory } from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import {
  searchFactsImpl,
  findSimilarFactsImpl,
  validateFactUniquenessImpl,
  validateKeyImpl,
  validateFactImpl,
} from './loreStore.utils';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreFactValidationActions = (_set: SetState, get: GetState) => ({
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) =>
    validateFactUniquenessImpl(worldId, key, value, get().facts),

  findSimilarFacts: (worldId: EntityID, value: string) =>
    findSimilarFactsImpl(worldId, value, get().facts),

  searchFacts: (query: string, options?: LoreSearchOptions) =>
    searchFactsImpl(
      query,
      Object.values(get().facts),
      options?.worldId,
      options?.category,
      options?.sessionId
    ),

  getFactHistory: (id: EntityID) => {
    const history = get().factHistory[id];
    return history ? history.versions : [];
  },

  validateFact: (fact: Partial<{ key: string; value: string; category: LoreCategory; worldId: EntityID }>) =>
    validateFactImpl(fact),
  validateKey: (key: string) => validateKeyImpl(key),

  getFactsCount: (worldId?: EntityID) => {
    const facts = get().facts;
    if (worldId) {
      return Object.values(facts).filter((fact) => fact.worldId === worldId)
        .length;
    }
    return Object.keys(facts).length;
  },
});
