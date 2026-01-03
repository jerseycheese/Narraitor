import type {
  LoreFact,
  LoreSearchOptions,
  LoreContext,
  LoreCategory,
  LoreSource,
  StructuredLoreExtraction,
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { createStoreError } from '@/lib/utils/errorUtils';
import { logger } from '@/lib/utils/logger';
import { importanceRank } from './loreStore.helpers';
import {
  addStructuredLoreImpl,
  type AddStructuredLoreContext,
} from './loreStore.extraction';
import { resolveEntityImpl } from './loreStore.resolution';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreFactCoreActions = (set: SetState, get: GetState) => ({
  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ) => {
    if (!get().validateFact({ key, value, category, worldId })) {
      logger.error('[LoreStore] addFact validation failed', {
        key,
        value,
        category,
        worldId,
      });
      set({
        error: createStoreError(
          'Invalid Lore Fact',
          'Lore facts require a key, value, category, and world.'
        ),
      });
      return '' as EntityID;
    }

    if (!get().validateKey(key)) {
      logger.error('[LoreStore] addFact invalid key', { key });
      set({
        error: createStoreError(
          'Invalid Lore Key',
          'Lore keys must start with a letter and contain only letters, numbers, or underscores.'
        ),
      });
      return '' as EntityID;
    }

    if (!get().validateFactUniqueness(worldId, key, value)) {
      logger.debug('[LoreStore] addFact duplicate fact (skipping)', {
        key,
        value,
      });
      set({
        error: createStoreError(
          'Duplicate Lore Fact',
          'A lore fact with this key and value already exists for this world.'
        ),
      });
      return '' as EntityID;
    }

    const factId = get().create({
      key,
      value,
      aliases: [],
      category,
      source,
      worldId,
      sessionId,
      metadata,
      visibility: visibility ?? (sessionId ? 'session-private' : 'world-shared'),
    });
    logger.debug('[LoreStore] addFact created fact', { factId, key, value });
    return factId;
  },

  getFacts: (options?: LoreSearchOptions): LoreFact[] => {
    let results = Object.values(get().facts);

    if (options?.worldId) {
      results = results.filter((fact) => fact.worldId === options.worldId);
    }
    if (options?.category) {
      results = results.filter((fact) => fact.category === options.category);
    }
    if (options?.sessionId) {
      results = results.filter((fact) => {
        if (fact.visibility === 'world-shared') return true;
        return (
          fact.visibility === 'session-private' &&
          fact.sessionId === options.sessionId
        );
      });
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  clearFacts: (worldId: EntityID) => {
    const facts = get().facts;
    const factHistory = get().factHistory;

    const remainingFacts = Object.fromEntries(
      Object.entries(facts).filter(([, fact]) => fact.worldId !== worldId)
    );
    const remainingHistory = Object.fromEntries(
      Object.entries(factHistory).filter(([factId]) => factId in remainingFacts)
    );

    set((state) => ({
      facts: remainingFacts,
      entities: remainingFacts,
      factHistory: remainingHistory,
      currentEntityId:
        state.currentEntityId && !(state.currentEntityId in remainingFacts)
          ? null
          : state.currentEntityId,
      error: null,
    }));
  },

  getLoreContext: (
    worldId: EntityID,
    sessionId?: EntityID,
    limit = 20
  ): LoreContext => {
    const worldFacts = get().getFacts({ worldId });

    const visibleFacts = worldFacts.filter((fact) => {
      if (fact.visibility === 'world-shared') return true;
      return fact.visibility === 'session-private' && fact.sessionId === sessionId;
    });

    const sortedFacts = visibleFacts.sort((a, b) => {
      const rankA = importanceRank(a.metadata?.importance);
      const rankB = importanceRank(b.metadata?.importance);

      if (rankA !== rankB) {
        return rankB - rankA;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const selectedFacts = sortedFacts.slice(0, limit);
    const factStrings = selectedFacts.map(
      (fact) => `${fact.category}: ${fact.key} = ${fact.value}`
    );
    return {
      facts: factStrings,
      factCount: factStrings.length,
      factIds: selectedFacts.map((fact) => fact.id),
    };
  },

  addStructuredLore: (
    extraction: StructuredLoreExtraction,
    worldId: EntityID,
    sessionId?: EntityID
  ) => {
    const context: AddStructuredLoreContext = {
      addFact: get().addFact,
      setAliases: get().setAliases,
      getFacts: get().getFacts,
      resolveEntity: resolveEntityImpl,
      addAlias: get().addAlias,
      getFact: get().getById,
    };
    addStructuredLoreImpl(extraction, worldId, sessionId, context);
  },

  updateFact: (id: EntityID, updates: Partial<LoreFact>) => get().update(id, updates),
  deleteFact: (id: EntityID) => get().delete(id),
});
