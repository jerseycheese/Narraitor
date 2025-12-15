import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { getTimestamp, safeTrim } from '@/lib/utils';
import { createIndexedDBStorage } from './persistence';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { UserFriendlyError, ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';

/**
 * Helper function to generate normalized lore keys
 */
function generateLoreKey(worldId: string, category: string, name: string, maxLength?: number): string {
  const normalizedName = normalizeText(name, NORM_NAME).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const truncatedName = maxLength ? normalizedName.substring(0, maxLength) : normalizedName;
  return `${worldId}:${category}_${truncatedName}`;
}

function shouldStoreExtractedCharacterName(name: string): boolean {
  const canonicalName = safeTrim(name).replace(/\s+/g, ' ');
  if (!canonicalName) return false;

  const normalized = normalizeText(canonicalName, NORM_NAME).toLowerCase();
  if (!normalized) return false;

  // Explicitly reject unnamed placeholders and descriptive phrases.
  if (normalized.startsWith('unnamed ') || normalized.startsWith('unknown ')) return false;
  if (normalized.includes(' with ')) return false;

  // Reject obvious group/plural entities (usually not a stable, named character).
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const isPluralGroup =
    tokens.length <= 3 &&
    tokens.some((token) => token.endsWith('s')) &&
    !canonicalName.includes("'"); // allow possessives/aliases like "King's Guard"
  if (isPluralGroup) return false;

  // Avoid sentence-like "names".
  if (tokens.length > 6) return false;

  return true;
}

function canonicalizeLocationName(name: string): {
  canonicalName: string;
  derivedAliases: string[];
} {
  const derivedAliases: string[] = [];
  let canonicalName = safeTrim(name).replace(/\s+/g, ' ');
  if (!canonicalName) {
    return { canonicalName: '', derivedAliases };
  }

  const original = canonicalName;

  const marketplaceEdgeMatch = canonicalName.match(/^(.*)\s+marketplace\s+edge$/i);
  if (marketplaceEdgeMatch?.[1]) {
    derivedAliases.push(original);
    canonicalName = `${safeTrim(marketplaceEdgeMatch[1])} marketplace`;
  }

  const edgeMatch = canonicalName.match(/^(.*)\s+edge$/i);
  if (edgeMatch?.[1]) {
    derivedAliases.push(original);
    canonicalName = safeTrim(edgeMatch[1]);
  }

  return { canonicalName, derivedAliases };
}

const MAX_EVENTS_PER_EXTRACTION = 3;

/**
 * Fact validation structure
 */
interface FactValidation {
  key: string;
  value: string;
  category: LoreCategory;
  worldId: EntityID;
}

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
  error: UserFriendlyError | null;
  loading: boolean;

  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata']
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

  validateFact: (fact: Partial<FactValidation>) => boolean;
  validateKey: (key: string) => boolean;

  getLoreContext: (worldId: EntityID, limit?: number) => LoreContext;
  addStructuredLore: (extraction: StructuredLoreExtraction, worldId: EntityID, sessionId?: EntityID) => void;

  // Alias management
  addAlias: (id: EntityID, alias: string) => void;
  removeAlias: (id: EntityID, alias: string) => void;
  setAliases: (id: EntityID, aliases: string[]) => void;
  findEntityByAnyName: (name: string, worldId: EntityID) => LoreFact | null;
}

const getInitialState = () => ({
  facts: {} as Record<EntityID, LoreFact>,
  entities: {} as Record<EntityID, LoreFact>,
  factHistory: {} as Record<EntityID, FactHistory>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const initialState = getInitialState();

export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => {
      return {
        ...initialState,

        create: (factData) => {
          const id = generateUniqueId();
          const now = getTimestamp();
          const newFact: LoreFact = {
            ...factData,
            aliases: factData.aliases ?? [], // Ensure aliases defaults to empty array
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
          if (!get().facts[id]) {
            return;
          }

          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedFact, ...remainingFacts } = state.facts;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedEntity, ...remainingEntities } = state.entities;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedHistory, ...remainingHistory } = state.factHistory;
            const shouldResetCurrent = state.currentEntityId === id;

            return {
              facts: remainingFacts,
              entities: remainingEntities,
              factHistory: remainingHistory,
              currentEntityId: shouldResetCurrent ? null : state.currentEntityId,
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

        addFact: (key, value, category, source, worldId, sessionId, metadata) => {
          if (!get().validateFact({ key, value, category, worldId })) {
            console.error('[LoreStore] addFact validation failed:', { key, value, category, worldId });
            set({ error: createStoreError('Invalid Lore Fact', 'Lore facts require a key, value, category, and world.') });
            return '' as EntityID;
          }

          if (!get().validateKey(key)) {
            console.error('[LoreStore] addFact invalid key:', { key });
            set({
              error: createStoreError(
                'Invalid Lore Key',
                'Lore keys must start with a letter and contain only letters, numbers, or underscores.'
              ),
            });
            return '' as EntityID;
          }

          if (!get().validateFactUniqueness(worldId, key, value)) {
            console.log('[LoreStore] addFact duplicate fact (skipping):', { key, value });
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
          });
          console.log('[LoreStore] addFact created fact:', { factId, key, value });
          return factId;
        },

        getFacts: (options) => {
          const facts = get().facts;
          let results = Object.values(facts);

          if (options?.worldId) {
            results = results.filter((fact) => fact.worldId === options.worldId);
          }

          if (options?.category) {
            results = results.filter((fact) => fact.category === options.category);
          }

          if (options?.sessionId) {
            results = results.filter((fact) => fact.sessionId === options.sessionId);
          }

          return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        },

        clearFacts: (worldId) => {
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

        getLoreContext: (worldId, limit = 10) => {
          const worldFacts = get().getFacts({ worldId });
          const recentFacts = worldFacts.slice(0, limit);

          const factStrings = recentFacts.map((fact) => `${fact.category}: ${fact.key} = ${fact.value}`);

          return {
            facts: factStrings,
            factCount: factStrings.length,
          };
        },

	        addStructuredLore: (extraction, worldId, sessionId) => {
          console.log('[LoreStore] addStructuredLore called:', {
            worldId,
            sessionId,
            extraction: {
              characters: extraction.characters.length,
              locations: extraction.locations.length,
              events: extraction.events.length,
              rules: extraction.rules.length,
            },
          });

          const { addFact, setAliases, getFacts } = get();

          const existingFacts = getFacts({ worldId });
          const existingKeys = new Set(existingFacts.map((fact) => fact.key));
          const existingFactsByKey = new Map(
            existingFacts.map((fact) => [fact.key, fact])
          );
          console.log('[LoreStore] Existing facts count:', existingFacts.length);

          const addedCount = { characters: 0, locations: 0, events: 0, rules: 0 };

          extraction.characters
            .filter((char) => shouldStoreExtractedCharacterName(char.name))
            .forEach((char) => {
            const key = generateLoreKey(worldId, 'character', char.name);
            if (!existingKeys.has(key)) {
              const factId = addFact(
                key,
                char.name,
                'characters',
                'narrative',
                worldId,
                sessionId,
                {
                  description: char.description,
                  type: char.role,
                  importance: char.importance || 'medium',
                  tags: char.tags,
                }
              );

              // Add aliases if extracted by AI
              if (char.aliases && char.aliases.length > 0 && factId) {
                setAliases(factId, char.aliases);
              }
              addedCount.characters++;
              console.log('[LoreStore] Added character fact:', {
                name: char.name,
                key,
                factId,
              });
            } else {
              const existing = existingFactsByKey.get(key);
              if (existing && char.aliases && char.aliases.length > 0) {
                setAliases(existing.id, [
                  ...(existing.aliases || []),
                  ...char.aliases,
                ]);
              }
            }
          });

          extraction.locations.forEach((loc) => {
            const { canonicalName, derivedAliases } = canonicalizeLocationName(loc.name);
            if (!canonicalName) {
              return;
            }

            const key = generateLoreKey(worldId, 'location', canonicalName);
            const aliasesToApply = [
              ...(Array.isArray(loc.aliases) ? loc.aliases : []),
              ...derivedAliases,
            ].filter(Boolean);

            if (!existingKeys.has(key)) {
              const factId = addFact(
                key,
                canonicalName,
                'locations',
                'narrative',
                worldId,
                sessionId,
                {
                  description: loc.description,
                  type: loc.type,
                  importance: loc.importance || 'medium',
                  tags: loc.tags,
                }
              );

              // Add aliases if extracted by AI
              if (aliasesToApply.length > 0 && factId) {
                setAliases(factId, aliasesToApply);
              }
              addedCount.locations++;
              console.log('[LoreStore] Added location fact:', {
                name: canonicalName,
                key,
                factId,
              });
            } else {
              const existing = existingFactsByKey.get(key);
              if (existing && aliasesToApply.length > 0) {
                setAliases(existing.id, [
                  ...(existing.aliases || []),
                  ...aliasesToApply,
                ]);
              }
            }
          });

          const existingEventValues = new Set(
            existingFacts
              .filter((fact) => fact.category === 'events')
              .map((fact) => normalizeText(fact.value, NORM_NAME).toLowerCase())
              .filter(Boolean)
          );

          const importanceRank = (importance?: string) => {
            if (importance === 'high') return 3;
            if (importance === 'medium') return 2;
            if (importance === 'low') return 1;
            return 0;
          };

          const eventCandidates = extraction.events
            .filter((event) => typeof event.description === 'string' && safeTrim(event.description).length > 0)
            .sort((a, b) => {
              const rankDiff = importanceRank(b.importance as string | undefined) - importanceRank(a.importance as string | undefined);
              if (rankDiff !== 0) return rankDiff;
              return safeTrim(b.description).length - safeTrim(a.description).length;
            });

          const addedEventValues = new Set<string>();
          let eventsAdded = 0;

          eventCandidates.forEach((event) => {
            if (eventsAdded >= MAX_EVENTS_PER_EXTRACTION) {
              return;
            }

            const normalizedDescription = normalizeText(event.description, NORM_NAME).toLowerCase();
            if (!normalizedDescription) {
              return;
            }
            if (existingEventValues.has(normalizedDescription) || addedEventValues.has(normalizedDescription)) {
              return;
            }

            const key = generateLoreKey(worldId, 'event', event.description, 30);
            if (!existingKeys.has(key)) {
              addFact(key, event.description, 'events', 'narrative', worldId, sessionId, {
                description: event.significance,
                importance: event.importance || 'medium',
                relatedEntities: event.relatedEntities,
              });
              addedCount.events++;
              eventsAdded++;
              addedEventValues.add(normalizedDescription);
              console.log('[LoreStore] Added event fact:', { description: event.description, key });
            }
          });

          extraction.rules.forEach((rule) => {
            const key = generateLoreKey(worldId, 'rule', rule.rule, 30);
            if (!existingKeys.has(key)) {
              addFact(key, rule.rule, 'rules', 'narrative', worldId, sessionId, {
                description: rule.context,
                importance: rule.importance || 'medium',
                tags: rule.tags,
              });
              addedCount.rules++;
              console.log('[LoreStore] Added rule fact:', { rule: rule.rule, key });
            }
          });

          console.log('[LoreStore] addStructuredLore complete:', addedCount);
          const updatedFactsCount = getFacts({ worldId }).length;
          console.log('[LoreStore] Total facts after addition:', updatedFactsCount);
        },

        updateFact: (id, updates) => get().update(id, updates),
        deleteFact: (id) => get().delete(id),

        validateFactUniqueness: (worldId, key, value) => {
          const facts = get().facts;
          const worldFacts = Object.values(facts).filter((fact) => fact.worldId === worldId);
          return !worldFacts.some((fact) => fact.key === key && fact.value === value);
        },

        findSimilarFacts: (worldId, value) => {
          const facts = get().facts;
          const worldFacts = Object.values(facts).filter((fact) => fact.worldId === worldId);
          const normalizedValue = normalizeText(value, NORM_NAME).toLowerCase();

          return worldFacts.filter((fact) => {
            const normalizedFactValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
            const normalizedAliases = fact.aliases?.map(a => normalizeText(a, NORM_NAME).toLowerCase()) || [];
            return normalizedFactValue === normalizedValue ||
                   normalizedAliases.some(alias => alias === normalizedValue);
          });
        },

        searchFacts: (query, options) => {
          const facts = get().facts;
          const normalizedQuery = query.toLowerCase();

          let results = Object.values(facts);

          if (options?.worldId) {
            results = results.filter((fact) => fact.worldId === options.worldId);
          }

          if (options?.category) {
            results = results.filter((fact) => fact.category === options.category);
          }

          if (options?.sessionId) {
            results = results.filter((fact) => fact.sessionId === options.sessionId);
          }

          results = results.filter((fact) =>
            fact.value.toLowerCase().includes(normalizedQuery) ||
            fact.key.toLowerCase().includes(normalizedQuery) ||
            fact.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery)) ||
            fact.metadata?.description?.toLowerCase().includes(normalizedQuery) ||
            fact.metadata?.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          );

          return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        },

          exportFacts: (worldId) => {
            const facts = get().getFacts({ worldId });
            const exportData = {
              worldId,
              exportedAt: getTimestamp(),
              facts: facts.map((fact) => ({
                key: fact.key,
                value: fact.value,
                aliases: Array.isArray(fact.aliases) ? fact.aliases : [],
                category: fact.category,
                source: fact.source,
                metadata: fact.metadata,
              })),
            };

            return JSON.stringify(exportData, null, 2);
          },

          importFacts: (worldId, jsonData) => {
            try {
              const data = JSON.parse(jsonData);
              const { addFact, validateFactUniqueness, getFacts, setAliases } = get();

              if (!data.facts || !Array.isArray(data.facts)) {
                throw new Error('Invalid import data structure');
              }

              data.facts.forEach(
                (fact: {
                  key: string;
                  value: string;
                  aliases?: string[];
                  category: LoreCategory;
                  source?: LoreSource;
                  metadata?: {
                    description?: string;
                    importance?: 'low' | 'medium' | 'high';
                    tags?: string[];
                    relatedEntities?: string[];
                    type?: string;
                  };
                }) => {
                  if (validateFactUniqueness(worldId, fact.key, fact.value)) {
                    const createdId = addFact(
                      fact.key,
                      fact.value,
                      fact.category,
                      fact.source || 'manual',
                      worldId,
                      undefined,
                      fact.metadata
                    );
                    if (
                      createdId &&
                      Array.isArray(fact.aliases) &&
                      fact.aliases.length > 0
                    ) {
                      setAliases(createdId, fact.aliases);
                    }
                  } else if (
                    Array.isArray(fact.aliases) &&
                    fact.aliases.length > 0
                  ) {
                    // Merge aliases into the existing fact if present
                    const existing = getFacts({ worldId }).find(
                      (existingFact) =>
                        existingFact.key === fact.key &&
                        existingFact.value === fact.value
                    );
                    if (existing) {
                      setAliases(existing.id, [
                        ...(existing.aliases || []),
                        ...fact.aliases,
                      ]);
                    }
                  }
                }
              );
            } catch (error) {
              set({
                error: createStoreError(
                  'Lore Import Failed',
                  error instanceof Error
                    ? error.message
                    : 'Unknown import error occurred.',
                  ErrorType.SERVICE
                ),
              });
              throw new Error(
                `Failed to import facts for worldId "${worldId}": ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
            }
          },

        getFactHistory: (id) => {
          const history = get().factHistory[id];
          return history ? history.versions : [];
        },

        validateFact: (fact) => {
          const validCategories: LoreCategory[] = ['characters', 'locations', 'events', 'rules'];
          if (!fact.key || fact.key.trim() === '') return false;
          if (!fact.value || fact.value.trim() === '') return false;
          if (!fact.category || !validCategories.includes(fact.category)) return false;
          if (!fact.worldId || fact.worldId.trim() === '') return false;
          return true;
        },

        validateKey: (key) => {
          if (key.includes(':')) {
            const structuredPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9:_-]+$/;
            return structuredPattern.test(key);
          }
          const keyPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
          return keyPattern.test(key);
        },

        cleanupOldFacts: (worldId, keepRecentCount = 50) => {
          const facts = get().facts;
          const factHistory = get().factHistory;

          const worldFacts = Object.entries(facts)
            .filter(([, fact]) => fact.worldId === worldId)
            .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

          set((state) => ({
            facts: remainingFacts,
            entities: remainingFacts,
            factHistory: remainingHistory,
            currentEntityId:
              state.currentEntityId && idsToRemove.has(state.currentEntityId) ? null : state.currentEntityId,
          }));
        },

        compactFactHistory: (maxVersionsPerFact = 3) => {
          const factHistory = get().factHistory;
          const compactedHistory: Record<EntityID, FactHistory> = {};

          Object.entries(factHistory).forEach(([factId, history]) => {
            const recentVersions = history.versions
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, maxVersionsPerFact);

            compactedHistory[factId] = {
              factId: history.factId,
              versions: recentVersions,
            };
          });

          set({ factHistory: compactedHistory });
        },

        getFactsCount: (worldId) => {
          const facts = get().facts;
          if (worldId) {
            return Object.values(facts).filter((fact) => fact.worldId === worldId).length;
          }
          return Object.keys(facts).length;
        },

        // Alias management functions
        addAlias: (id, alias) => {
          const fact = get().facts[id];
          if (!fact) return;

          const trimmedAlias = alias.trim();
          if (!trimmedAlias) return;

          const currentAliases = fact.aliases || [];
          if (currentAliases.includes(trimmedAlias)) return; // Prevent duplicates

          get().update(id, {
            aliases: [...currentAliases, trimmedAlias],
          });
        },

        removeAlias: (id, alias) => {
          const fact = get().facts[id];
          if (!fact) return;

          const currentAliases = fact.aliases || [];
          const updatedAliases = currentAliases.filter(a => a !== alias);

          get().update(id, {
            aliases: updatedAliases,
          });
        },

        setAliases: (id, aliases) => {
          const fact = get().facts[id];
          if (!fact) return;

          // Filter out empty strings and trim, then remove duplicates
          const cleanedAliases = aliases
            .map(a => a.trim())
            .filter(a => a.length > 0)
            .filter((alias, index, self) => self.indexOf(alias) === index);

          get().update(id, {
            aliases: cleanedAliases,
          });
        },

        findEntityByAnyName: (name, worldId) => {
          const facts = get().getFacts({ worldId });
          const normalizedName = normalizeText(name, NORM_NAME).toLowerCase();

          return facts.find(fact => {
            const normalizedValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
            const normalizedAliases = fact.aliases?.map(a => normalizeText(a, NORM_NAME).toLowerCase()) || [];

            return normalizedValue === normalizedName ||
                   normalizedAliases.includes(normalizedName);
          }) || null;
        },
      };
    },
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      version: 2, // Incremented to clear old migrated data
      partialize: (state) => ({
        facts: state.facts,
        factHistory: state.factHistory,
      }),
      migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
    }
  )
);
