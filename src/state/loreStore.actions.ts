import type {
  LoreFact,
  LoreSearchOptions,
  LoreContext,
  LoreCategory,
  LoreSource,
  StructuredLoreExtraction,
  LoreMergeAuditEntry,
  EntityMatch,
  LoreUsageEvent,
  LoreUsageSource,
  LoreUsageStats,
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import {
  createStoreError,
  type UserFriendlyError,
} from '@/lib/utils/errorUtils';
import { logger } from '@/lib/utils/logger';

import { getInitialState } from './loreStore.state';
import { importanceRank } from './loreStore.helpers';
import type { LoreStore } from './loreStore.types';
import {
  addStructuredLoreImpl,
  type AddStructuredLoreContext,
} from './loreStore.extraction';
import {
  resolveEntityImpl,
  updateEntityReferencesImpl,
  findPotentialEntityMatchesImpl,
  type ReferenceUpdateContext,
} from './loreStore.resolution';
import {
  mergeFactsImpl,
  type DeduplicationContext,
} from './loreStore.deduplication';
import {
  addAliasImpl,
  removeAliasImpl,
  setAliasesImpl,
  findEntityByAnyNameImpl,
  type AliasManagementContext,
} from './loreStore.aliases';
import {
  exportFactsImpl,
  importFactsImpl,
  type ImportExportContext,
} from './loreStore.import-export';
import {
  searchFactsImpl,
  findSimilarFactsImpl,
  validateFactUniquenessImpl,
  validateKeyImpl,
  validateFactImpl,
  cleanupOldFactsImpl,
  compactFactHistoryImpl,
  type LoreUtilsContext,
} from './loreStore.utils';

type SetState = (
  partial: Partial<LoreStore> | ((state: LoreStore) => Partial<LoreStore>)
) => void;
type GetState = () => LoreStore;

const MAX_LORE_USAGE_EVENTS = 200;
const MIN_MENTION_TERM_LENGTH = 3;

// ─── Base CRUD ──────────────────────────────────────────────────────────────

const createBaseActions = (set: SetState, get: GetState) => ({
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
  reset: () => set(getInitialState()),
  setError: (error: UserFriendlyError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ loading }),
});

// ─── Facts (core, validation, maintenance, dedupe) ──────────────────────────

export const createLoreFactActions = (set: SetState, get: GetState) => ({
  // ─── Core ─────────────────────────────────────────────────────────────────
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
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
    limit = 20,
    options?: { categoryBalanced?: boolean }
  ): LoreContext => {
    const worldFacts = get().getFacts({ worldId });

    const visibleFacts = worldFacts.filter((fact) => {
      if (fact.visibility === 'world-shared') return true;
      return (
        fact.visibility === 'session-private' && fact.sessionId === sessionId
      );
    });

    const byImportance = (a: LoreFact, b: LoreFact) => {
      const rankA = importanceRank(a.metadata?.importance);
      const rankB = importanceRank(b.metadata?.importance);
      if (rankA !== rankB) return rankB - rankA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    let selectedFacts: LoreFact[];

    if (options?.categoryBalanced) {
      // Round-robin across categories so character-heavy worlds don't crowd out
      // locations / rules / events. Within each category we still prefer higher
      // importance, falling back to recency.
      const buckets: Record<LoreCategory, LoreFact[]> = {
        characters: [],
        locations: [],
        events: [],
        rules: [],
      };
      for (const fact of visibleFacts) {
        buckets[fact.category]?.push(fact);
      }
      for (const category of Object.keys(buckets) as LoreCategory[]) {
        buckets[category].sort(byImportance);
      }
      selectedFacts = [];
      const order: LoreCategory[] = ['characters', 'locations', 'rules', 'events'];
      while (selectedFacts.length < limit) {
        const before = selectedFacts.length;
        for (const category of order) {
          if (selectedFacts.length >= limit) break;
          const next = buckets[category].shift();
          if (next) selectedFacts.push(next);
        }
        if (selectedFacts.length === before) break; // no more facts to draw
      }
    } else {
      selectedFacts = [...visibleFacts].sort(byImportance).slice(0, limit);
    }

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
      updateFact: get().update,
    };
    addStructuredLoreImpl(extraction, worldId, sessionId, context);
  },

  updateFact: (id: EntityID, updates: Partial<LoreFact>) =>
    get().update(id, updates),
  deleteFact: (id: EntityID) => get().delete(id),

  // ─── Validation ───────────────────────────────────────────────────────────
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

  validateFact: (
    fact: Partial<{
      key: string;
      value: string;
      category: LoreCategory;
      worldId: EntityID;
    }>
  ) => validateFactImpl(fact),
  validateKey: (key: string) => validateKeyImpl(key),

  getFactsCount: (worldId?: EntityID) => {
    const facts = get().facts;
    if (worldId) {
      return Object.values(facts).filter((fact) => fact.worldId === worldId)
        .length;
    }
    return Object.keys(facts).length;
  },

  // ─── Maintenance ──────────────────────────────────────────────────────────
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

  // ─── Deduplication ────────────────────────────────────────────────────────
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

  findPotentialEntityMatches: (
    worldId: EntityID,
    options?: { minConfidence?: number; category?: LoreCategory }
  ): EntityMatch[] =>
    findPotentialEntityMatchesImpl(
      worldId,
      { getFacts: get().getFacts },
      options
    ),
});

// ─── Aliases ────────────────────────────────────────────────────────────────

export const createLoreAliasActions = (_set: SetState, get: GetState) => {
  const aliasContext = (): AliasManagementContext => ({
    getFact: get().getById,
    updateFact: get().update,
    getFacts: get().getFacts,
    getAllFacts: () => get().facts,
  });

  return {
    addAlias: (id: EntityID, alias: string) =>
      addAliasImpl(id, alias, aliasContext()),
    removeAlias: (id: EntityID, alias: string) =>
      removeAliasImpl(id, alias, aliasContext()),
    setAliases: (id: EntityID, aliases: string[]) =>
      setAliasesImpl(id, aliases, aliasContext()),
    findEntityByAnyName: (name: string, worldId: EntityID) =>
      findEntityByAnyNameImpl(name, worldId, aliasContext()),
  };
};

// ─── Import / Export ────────────────────────────────────────────────────────

export const createLoreImportExportActions = (
  set: SetState,
  get: GetState
) => {
  const importExportContext = (): ImportExportContext => ({
    getFacts: get().getFacts,
    addFact: get().addFact,
    validateFactUniqueness: get().validateFactUniqueness,
    setAliases: get().setAliases,
    setError: (error) => set({ error }),
  });

  return {
    exportFacts: (worldId: EntityID) =>
      exportFactsImpl(worldId, importExportContext()),
    importFacts: (worldId: EntityID, jsonData: string) =>
      importFactsImpl(worldId, jsonData, importExportContext()),
  };
};

// ─── Usage tracking ─────────────────────────────────────────────────────────

export const createLoreUsageActions = (set: SetState, get: GetState) => ({
  recordLoreUsage: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    source?: LoreUsageSource;
  }) => {
    const { worldId, sessionId, factIds, source } = input;
    if (!factIds || factIds.length === 0) return;

    const now = getTimestamp();
    const existingFactIds = factIds.filter((id) => id in get().facts);
    if (existingFactIds.length === 0) return;

    set((state) => {
      const updatedUsage: Record<EntityID, LoreUsageStats> = {
        ...state.loreUsage,
      };

      existingFactIds.forEach((id) => {
        const previous = updatedUsage[id] ?? { usageCount: 0, mentionCount: 0 };
        updatedUsage[id] = {
          ...previous,
          usageCount: previous.usageCount + 1,
          lastUsedAt: now,
          lastSource: source ?? 'unknown',
          lastSessionId: sessionId,
        };
      });

      const usageEvent: LoreUsageEvent = {
        id: generateUniqueId('lore-usage'),
        worldId,
        sessionId,
        source: source ?? 'unknown',
        eventType: 'context',
        factIds: existingFactIds,
        timestamp: now,
      };

      return {
        loreUsage: updatedUsage,
        loreUsageEvents: [usageEvent, ...state.loreUsageEvents].slice(
          0,
          MAX_LORE_USAGE_EVENTS
        ),
      };
    });
  },

  recordLoreMentions: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    responseText: string;
    source?: LoreUsageSource;
  }) => {
    const { worldId, sessionId, factIds, responseText, source } = input;
    if (!responseText || !factIds || factIds.length === 0) return;

    const mentionedFactIds = factIds.filter((id) => {
      const fact = get().facts[id];
      if (!fact) return false;

      const terms = [fact.value, ...(fact.aliases || [])]
        .map((term) => term.trim())
        .filter((term) => term.length >= MIN_MENTION_TERM_LENGTH);

      return terms.some((term) => {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escapedTerm}\\b`, 'i');
        return pattern.test(responseText);
      });
    });

    if (mentionedFactIds.length === 0) return;

    const now = getTimestamp();
    const responseExcerpt = responseText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    set((state) => {
      const updatedUsage: Record<EntityID, LoreUsageStats> = {
        ...state.loreUsage,
      };

      mentionedFactIds.forEach((id) => {
        const previous = updatedUsage[id] ?? { usageCount: 0, mentionCount: 0 };
        updatedUsage[id] = {
          ...previous,
          mentionCount: previous.mentionCount + 1,
          lastMentionedAt: now,
        };
      });

      const mentionEvent: LoreUsageEvent = {
        id: generateUniqueId('lore-mention'),
        worldId,
        sessionId,
        source: source ?? 'unknown',
        eventType: 'mention',
        factIds: mentionedFactIds,
        timestamp: now,
        responseExcerpt: responseExcerpt || undefined,
      };

      return {
        loreUsage: updatedUsage,
        loreUsageEvents: [mentionEvent, ...state.loreUsageEvents].slice(
          0,
          MAX_LORE_USAGE_EVENTS
        ),
      };
    });
  },

  clearLoreUsage: (worldId?: EntityID) => {
    if (!worldId) {
      set({ loreUsage: {}, loreUsageEvents: [] });
      return;
    }

    const worldFactIds = new Set(
      Object.values(get().facts)
        .filter((fact) => fact.worldId === worldId)
        .map((fact) => fact.id)
    );

    set((state) => ({
      loreUsage: Object.fromEntries(
        Object.entries(state.loreUsage).filter(
          ([id]) => !worldFactIds.has(id)
        )
      ),
      loreUsageEvents: state.loreUsageEvents.filter(
        (event) => event.worldId !== worldId
      ),
    }));
  },
});

// ─── Combined base actions export ───────────────────────────────────────────

export const createLoreBaseActions = createBaseActions;
