import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { createIndexedDBStorage } from './persistence';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';
import { logger } from '@/lib/utils/logger';
import { addStructuredLoreImpl, type AddStructuredLoreContext } from './loreStore.extraction';
import {
  addAliasImpl,
  removeAliasImpl,
  setAliasesImpl,
  findEntityByAnyNameImpl,
  type AliasManagementContext,
} from './loreStore.aliases';
import { importanceRank } from './loreStore.helpers';
import { exportFactsImpl, importFactsImpl, type ImportExportContext } from './loreStore.import-export';
import {
  cleanupOldFactsImpl,
  compactFactHistoryImpl,
  searchFactsImpl,
  findSimilarFactsImpl,
  validateFactUniquenessImpl,
  validateKeyImpl,
  validateFactImpl,
  type LoreUtilsContext,
} from './loreStore.utils';
import {
  scanForDuplicatesImpl,
  mergeFactsImpl,
  checkDuplicateBeforeCreateImpl,
  type DeduplicationContext,
} from './loreStore.deduplication';
import {
  resolveEntityImpl,
  updateEntityReferencesImpl,
  findPotentialEntityMatchesImpl,
  type ReferenceUpdateContext,
} from './loreStore.resolution';
import type { DuplicateMatch } from '../types/lore.types';

/**
 * Fact history tracking
 */
interface FactHistory {
  factId: EntityID;
  versions: LoreFact[];
}

/**
 * Lore store for tracking narrative facts
 */
export interface LoreStore extends CrudStore<LoreFact> {
  facts: Record<EntityID, LoreFact>;
  factHistory: Record<EntityID, FactHistory>;
  mergeAuditLog: LoreMergeAuditEntry[];
  loreUsage: Record<EntityID, LoreUsageStats>;
  loreUsageEvents: LoreUsageEvent[];
  error: UserFriendlyError | null;
  loading: boolean;

  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ) => EntityID;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  clearFacts: (worldId: EntityID) => void;
  cleanupOldFacts: (worldId: EntityID, keepRecentCount?: number) => void;
  compactFactHistory: (maxVersionsPerFact?: number) => void;
  getFactsCount: (worldId?: EntityID) => number;
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) => boolean;
  findSimilarFacts: (worldId: EntityID, value: string) => LoreFact[];
  searchFacts: (query: string, options?: LoreSearchOptions) => LoreFact[];
  exportFacts: (worldId: EntityID) => string;
  importFacts: (worldId: EntityID, jsonData: string) => void;
  getFactHistory: (id: EntityID) => LoreFact[];
  validateFact: (fact: Partial<{ key: string; value: string; category: LoreCategory; worldId: EntityID }>) => boolean;
  validateKey: (key: string) => boolean;
  getLoreContext: (worldId: EntityID, sessionId?: EntityID, limit?: number) => LoreContext;
  addStructuredLore: (extraction: StructuredLoreExtraction, worldId: EntityID, sessionId?: EntityID) => void;
  addAlias: (id: EntityID, alias: string) => void;
  removeAlias: (id: EntityID, alias: string) => void;
  setAliases: (id: EntityID, aliases: string[]) => void;
  findEntityByAnyName: (name: string, worldId: EntityID) => LoreFact | null;
  scanForDuplicates: (worldId: EntityID, category?: LoreCategory) => Promise<DuplicateMatch[]>;
  mergeFacts: (primaryId: EntityID, secondaryId: EntityID) => void;
  checkDuplicateBeforeCreate: (value: string, category: LoreCategory, worldId: EntityID) => Promise<DuplicateMatch[]>;
  findPotentialEntityMatches: (worldId: EntityID, options?: { minConfidence?: number; category?: LoreCategory }) => EntityMatch[];
  getMergeAuditLog: () => LoreMergeAuditEntry[];
  recordLoreUsage: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    source?: LoreUsageSource;
  }) => void;
  recordLoreMentions: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    responseText: string;
    source?: LoreUsageSource;
  }) => void;
  clearLoreUsage: (worldId?: EntityID) => void;
}

const getInitialState = () => ({
  facts: {} as Record<EntityID, LoreFact>,
  entities: {} as Record<EntityID, LoreFact>,
  factHistory: {} as Record<EntityID, FactHistory>,
  mergeAuditLog: [] as LoreMergeAuditEntry[],
  loreUsage: {} as Record<EntityID, LoreUsageStats>,
  loreUsageEvents: [] as LoreUsageEvent[],
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const MAX_LORE_USAGE_EVENTS = 200;
const MIN_MENTION_TERM_LENGTH = 3;

export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      create: (factData) => {
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

      update: (id, updates) => {
        const fact = get().facts[id];
        if (!fact) {
          set({ error: createStoreError('Lore Fact Not Found', 'The specified lore fact could not be found.') });
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

      delete: (id) => {
        if (!get().facts[id]) return;

        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removedFact, ...remainingFacts } = state.facts;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removedEntity, ...remainingEntities } = state.entities;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removedHistory, ...remainingHistory } = state.factHistory;

          return {
            facts: remainingFacts,
            entities: remainingEntities,
            factHistory: remainingHistory,
            currentEntityId: state.currentEntityId === id ? null : state.currentEntityId,
            error: null,
          };
        });
      },

      setCurrent: (id) => {
        if (id && !get().facts[id]) {
          set({
            error: createStoreError('Lore Fact Not Found', 'The specified lore fact could not be found.'),
            currentEntityId: null,
          });
          return;
        }
        set({ currentEntityId: id ?? null, error: null });
      },

      getById: (id) => get().facts[id],
      getAll: () => Object.values(get().facts),
      reset: () => set(getInitialState()),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),

      addFact: (key, value, category, source, worldId, sessionId, metadata, visibility) => {
        if (!get().validateFact({ key, value, category, worldId })) {
          logger.error('[LoreStore] addFact validation failed', { key, value, category, worldId });
          set({ error: createStoreError('Invalid Lore Fact', 'Lore facts require a key, value, category, and world.') });
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
          logger.debug('[LoreStore] addFact duplicate fact (skipping)', { key, value });
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

      getFacts: (options) => {
        let results = Object.values(get().facts);

        if (options?.worldId) {
          results = results.filter((fact) => fact.worldId === options.worldId);
        }
        if (options?.category) {
          results = results.filter((fact) => fact.category === options.category);
        }
        if (options?.sessionId) {
          // Apply visibility-aware filtering: world-shared OR (session-private AND my-session)
          results = results.filter((fact) => {
            if (fact.visibility === 'world-shared') return true;
            return fact.visibility === 'session-private' && fact.sessionId === options.sessionId;
          });
        }

        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      clearFacts: (worldId) => {
        const facts = get().facts;
        const factHistory = get().factHistory;

        const remainingFacts = Object.fromEntries(Object.entries(facts).filter(([, fact]) => fact.worldId !== worldId));
        const remainingHistory = Object.fromEntries(
          Object.entries(factHistory).filter(([factId]) => factId in remainingFacts)
        );

        set((state) => ({
          facts: remainingFacts,
          entities: remainingFacts,
          factHistory: remainingHistory,
          currentEntityId: state.currentEntityId && !(state.currentEntityId in remainingFacts) ? null : state.currentEntityId,
          error: null,
        }));
      },

      getLoreContext: (worldId, sessionId, limit = 20) => {
        const worldFacts = get().getFacts({ worldId });

        // Filter by visibility rules: world-shared OR (session-private AND my-session)
        const visibleFacts = worldFacts.filter(fact => {
          if (fact.visibility === 'world-shared') return true;
          return fact.visibility === 'session-private' && fact.sessionId === sessionId;
        });

        // Sort by importance (high to low), then by recency within same importance
        const sortedFacts = visibleFacts.sort((a, b) => {
          const rankA = importanceRank(a.metadata?.importance);
          const rankB = importanceRank(b.metadata?.importance);

          // Primary sort: importance (descending)
          if (rankA !== rankB) {
            return rankB - rankA; // Higher importance first
          }

          // Secondary sort: recency (descending) for same importance
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        const selectedFacts = sortedFacts.slice(0, limit);
        const factStrings = selectedFacts.map((fact) => `${fact.category}: ${fact.key} = ${fact.value}`);
        return { facts: factStrings, factCount: factStrings.length, factIds: selectedFacts.map((fact) => fact.id) };
      },

      addStructuredLore: (extraction, worldId, sessionId) => {
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

      updateFact: (id, updates) => get().update(id, updates),
      deleteFact: (id) => get().delete(id),

      validateFactUniqueness: (worldId, key, value) => validateFactUniquenessImpl(worldId, key, value, get().facts),

      findSimilarFacts: (worldId, value) => findSimilarFactsImpl(worldId, value, get().facts),

      searchFacts: (query, options) =>
        searchFactsImpl(query, Object.values(get().facts), options?.worldId, options?.category, options?.sessionId),

      exportFacts: (worldId) => {
        const context: ImportExportContext = {
          getFacts: get().getFacts,
          addFact: get().addFact,
          validateFactUniqueness: get().validateFactUniqueness,
          setAliases: get().setAliases,
          setError: (error) => set({ error }),
        };
        return exportFactsImpl(worldId, context);
      },

      importFacts: (worldId, jsonData) => {
        const context: ImportExportContext = {
          getFacts: get().getFacts,
          addFact: get().addFact,
          validateFactUniqueness: get().validateFactUniqueness,
          setAliases: get().setAliases,
          setError: (error) => set({ error }),
        };
        importFactsImpl(worldId, jsonData, context);
      },

      getFactHistory: (id) => {
        const history = get().factHistory[id];
        return history ? history.versions : [];
      },

      validateFact: (fact) => validateFactImpl(fact),
      validateKey: (key) => validateKeyImpl(key),

      cleanupOldFacts: (worldId, keepRecentCount = 50) => {
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

      getFactsCount: (worldId) => {
        const facts = get().facts;
        if (worldId) {
          return Object.values(facts).filter((fact) => fact.worldId === worldId).length;
        }
        return Object.keys(facts).length;
      },

      addAlias: (id, alias) => {
        const context: AliasManagementContext = {
          getFact: get().getById,
          updateFact: get().update,
          getFacts: get().getFacts,
        };
        addAliasImpl(id, alias, context);
      },

      removeAlias: (id, alias) => {
        const context: AliasManagementContext = {
          getFact: get().getById,
          updateFact: get().update,
          getFacts: get().getFacts,
        };
        removeAliasImpl(id, alias, context);
      },

      setAliases: (id, aliases) => {
        const context: AliasManagementContext = {
          getFact: get().getById,
          updateFact: get().update,
          getFacts: get().getFacts,
        };
        setAliasesImpl(id, aliases, context);
      },

      findEntityByAnyName: (name, worldId) => {
        const context: AliasManagementContext = {
          getFact: get().getById,
          updateFact: get().update,
          getFacts: get().getFacts,
        };
        return findEntityByAnyNameImpl(name, worldId, context);
      },

      scanForDuplicates: async (worldId, category) => {
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

      mergeFacts: (primaryId, secondaryId) => {
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

      checkDuplicateBeforeCreate: async (value, category, worldId) => {
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

      findPotentialEntityMatches: (worldId, options) =>
        findPotentialEntityMatchesImpl(worldId, { getFacts: get().getFacts }, options),

      getMergeAuditLog: () => get().mergeAuditLog,

      recordLoreUsage: ({ worldId, sessionId, factIds, source }) => {
        if (!factIds || factIds.length === 0) return;

        const now = getTimestamp();
        const existingFactIds = factIds.filter((id) => id in get().facts);
        if (existingFactIds.length === 0) return;

        set((state) => {
          const updatedUsage = { ...state.loreUsage };

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
            loreUsageEvents: [usageEvent, ...state.loreUsageEvents].slice(0, MAX_LORE_USAGE_EVENTS),
          };
        });
      },

      recordLoreMentions: ({ worldId, sessionId, factIds, responseText, source }) => {
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
        const responseExcerpt = responseText.replace(/\s+/g, ' ').trim().slice(0, 160);

        set((state) => {
          const updatedUsage = { ...state.loreUsage };

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
            loreUsageEvents: [mentionEvent, ...state.loreUsageEvents].slice(0, MAX_LORE_USAGE_EVENTS),
          };
        });
      },

      clearLoreUsage: (worldId) => {
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
            Object.entries(state.loreUsage).filter(([id]) => !worldFactIds.has(id))
          ),
          loreUsageEvents: state.loreUsageEvents.filter((event) => event.worldId !== worldId),
        }));
      },
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
