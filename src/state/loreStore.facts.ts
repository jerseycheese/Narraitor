import type {
  LoreFact,
  LoreSearchOptions,
  LoreContext,
  LoreCategory,
  LoreSource,
  StructuredLoreExtraction,
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { createStoreError, type UserFriendlyError } from '@/lib/utils/errorUtils';
import { logger } from '@/lib/utils/logger';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { importanceRank } from './loreStore.helpers';
import { addStructuredLoreImpl, type AddStructuredLoreContext } from './loreStore.extraction';
import { resolveEntityImpl } from './loreStore.deduplication';
import type { LoreStore, FactHistory } from './loreStore';

type SetState = (
  partial: Partial<LoreStore> | ((state: LoreStore) => Partial<LoreStore>)
) => void;
type GetState = () => LoreStore;

export const createLoreFactActions = (set: SetState, get: GetState) => ({
  // ---------- Base CRUD ----------

  create: (factData: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateUniqueId();
    const now = getTimestamp();
    const newFact: LoreFact = {
      ...factData,
      aliases: factData.aliases ?? [],
      id,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      facts: { ...state.facts, [id]: newFact },
      entities: { ...state.entities, [id]: newFact },
      factHistory: {
        ...state.factHistory,
        [id]: { factId: id, versions: [newFact] },
      },
      error: null,
    }));

    return id;
  },

  update: (id: EntityID, updates: Partial<LoreFact>) => {
    const fact = get().facts[id];
    if (!fact) {
      set({
        error: createStoreError(
          'Lore Fact Not Found',
          'The specified lore fact could not be found.'
        ),
      });
      return;
    }

    const updatedFact: LoreFact = {
      ...fact,
      ...updates,
      id,
      createdAt: fact.createdAt,
      updatedAt: getTimestamp(),
    };

    const previousHistory = get().factHistory[id]?.versions ?? [];

    set((state) => ({
      facts: { ...state.facts, [id]: updatedFact },
      entities: { ...state.entities, [id]: updatedFact },
      factHistory: {
        ...state.factHistory,
        [id]: {
          factId: id,
          versions: [...previousHistory, updatedFact],
        },
      },
      error: null,
    }));
  },

  delete: (id: EntityID) => {
    if (!get().facts[id]) return;

    set((state) => {
      const { [id]: _removedFact, ...remainingFacts } = state.facts;
      const { [id]: _removedEntity, ...remainingEntities } = state.entities;
      const { [id]: _removedHistory, ...remainingHistory } = state.factHistory;
      void _removedFact;
      void _removedEntity;
      void _removedHistory;

      return {
        facts: remainingFacts,
        entities: remainingEntities,
        factHistory: remainingHistory,
        currentEntityId:
          state.currentEntityId === id ? null : state.currentEntityId,
        error: null,
      };
    });
  },

  setCurrent: (id: EntityID | null) => {
    if (id && !get().facts[id]) {
      set({
        error: createStoreError(
          'Lore Fact Not Found',
          'The specified lore fact could not be found.'
        ),
        currentEntityId: null,
      });
      return;
    }
    set({ currentEntityId: id ?? null, error: null });
  },

  getById: (id: EntityID) => get().facts[id],
  getAll: () => Object.values(get().facts),
  setError: (error: UserFriendlyError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ loading }),

  // ---------- Fact CRUD (with validation) ----------

  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ): EntityID => {
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

  // ---------- Validation ----------

  validateFactUniqueness: (worldId: EntityID, key: string, value: string): boolean => {
    const worldFacts = Object.values(get().facts).filter(
      (fact) => fact.worldId === worldId
    );
    return !worldFacts.some((fact) => fact.key === key && fact.value === value);
  },

  findSimilarFacts: (worldId: EntityID, value: string): LoreFact[] => {
    const worldFacts = Object.values(get().facts).filter(
      (fact) => fact.worldId === worldId
    );
    const normalizedValue = normalizeText(value, NORM_NAME).toLowerCase();

    return worldFacts.filter((fact) => {
      const normalizedFactValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
      const normalizedAliases =
        fact.aliases?.map((a) => normalizeText(a, NORM_NAME).toLowerCase()) || [];
      return (
        normalizedFactValue === normalizedValue ||
        normalizedAliases.some((alias) => alias === normalizedValue)
      );
    });
  },

  searchFacts: (query: string, options?: LoreSearchOptions): LoreFact[] => {
    const normalizedQuery = query.toLowerCase();
    let results = Object.values(get().facts);

    if (options?.worldId) {
      results = results.filter((fact) => fact.worldId === options.worldId);
    }
    if (options?.category) {
      results = results.filter((fact) => fact.category === options.category);
    }
    if (options?.sessionId) {
      results = results.filter((fact) => fact.sessionId === options.sessionId);
    }

    results = results.filter(
      (fact) =>
        fact.value.toLowerCase().includes(normalizedQuery) ||
        fact.key.toLowerCase().includes(normalizedQuery) ||
        fact.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery)) ||
        fact.metadata?.description?.toLowerCase().includes(normalizedQuery) ||
        fact.metadata?.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getFactHistory: (id: EntityID) => {
    const history = get().factHistory[id];
    return history ? history.versions : [];
  },

  validateFact: (
    fact: Partial<{
      key: string;
      value: string;
      category: LoreCategory;
      worldId: EntityID;
    }>
  ): boolean => {
    const validCategories: LoreCategory[] = ['characters', 'locations', 'events', 'rules'];
    if (!fact.key || fact.key.trim() === '') return false;
    if (!fact.value || fact.value.trim() === '') return false;
    if (!fact.category || !validCategories.includes(fact.category as LoreCategory))
      return false;
    if (!fact.worldId || fact.worldId.trim() === '') return false;
    return true;
  },

  validateKey: (key: string): boolean => {
    if (key.includes(':')) {
      const structuredPattern = /^[a-zA-Z0-9_-]+:[a-z0-9_]+(?:_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/;
      return structuredPattern.test(key);
    }

    const normalizedPattern = /^[a-z][a-z0-9_]*$/;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return normalizedPattern.test(key) || uuidPattern.test(key);
  },

  getFactsCount: (worldId?: EntityID) => {
    const facts = get().facts;
    if (worldId) {
      return Object.values(facts).filter((fact) => fact.worldId === worldId).length;
    }
    return Object.keys(facts).length;
  },

  // ---------- Maintenance ----------

  cleanupOldFacts: (worldId: EntityID, keepRecentCount = 50) => {
    const facts = get().facts;
    const factHistory = get().factHistory;

    const worldFacts = Object.entries(facts)
      .filter(([, fact]) => fact.worldId === worldId)
      .sort(
        ([, a], [, b]) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    if (worldFacts.length <= keepRecentCount) {
      return;
    }

    const factsToRemove = worldFacts.slice(keepRecentCount);
    const idsToRemove = new Set(factsToRemove.map(([factId]) => factId));

    const remainingFacts = Object.fromEntries(
      Object.entries(facts).filter(([factId]) => !idsToRemove.has(factId))
    );

    const remainingHistory = Object.fromEntries(
      Object.entries(factHistory).filter(([factId]) => !idsToRemove.has(factId))
    );

    set({
      facts: remainingFacts,
      entities: remainingFacts,
      factHistory: remainingHistory,
    });
  },

  compactFactHistory: (maxVersionsPerFact = 3) => {
    const factHistory = get().factHistory;
    const compactedHistory: Record<EntityID, FactHistory> = {};

    Object.entries(factHistory).forEach(([factId, history]) => {
      const recentVersions = history.versions
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, maxVersionsPerFact);

      compactedHistory[factId] = {
        factId: history.factId,
        versions: recentVersions,
      };
    });

    set({ factHistory: compactedHistory });
  },
});
