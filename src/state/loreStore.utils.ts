import type { EntityID } from '../types/common.types';
import type { LoreFact, LoreCategory } from '../types/lore.types';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';

/**
 * Utility functions for lore store
 * Includes cleanup, history management, search, and validation
 */

interface FactHistory {
  factId: EntityID;
  versions: LoreFact[];
}

export interface LoreUtilsContext {
  getFacts: () => Record<EntityID, LoreFact>;
  getFactHistory: () => Record<EntityID, FactHistory>;
  setStore: (updates: {
    facts?: Record<EntityID, LoreFact>;
    entities?: Record<EntityID, LoreFact>;
    factHistory?: Record<EntityID, FactHistory>;
    currentEntityId?: EntityID | null;
  }) => void;
}

/**
 * Cleans up old facts, keeping only the most recent ones
 */
export function cleanupOldFactsImpl(
  worldId: EntityID,
  keepRecentCount: number,
  context: LoreUtilsContext
): void {
  const facts = context.getFacts();
  const factHistory = context.getFactHistory();

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

  context.setStore({
    facts: remainingFacts,
    entities: remainingFacts,
    factHistory: remainingHistory,
  });
}

/**
 * Compacts fact history to keep only recent versions
 */
export function compactFactHistoryImpl(
  maxVersionsPerFact: number,
  context: LoreUtilsContext
): void {
  const factHistory = context.getFactHistory();
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

  context.setStore({ factHistory: compactedHistory });
}

/**
 * Searches facts by query string
 */
export function searchFactsImpl(
  query: string,
  allFacts: LoreFact[],
  worldId?: EntityID,
  category?: LoreCategory,
  sessionId?: EntityID
): LoreFact[] {
  const normalizedQuery = query.toLowerCase();
  let results = allFacts;

  if (worldId) {
    results = results.filter((fact) => fact.worldId === worldId);
  }

  if (category) {
    results = results.filter((fact) => fact.category === category);
  }

  if (sessionId) {
    results = results.filter((fact) => fact.sessionId === sessionId);
  }

  results = results.filter(
    (fact) =>
      fact.value.toLowerCase().includes(normalizedQuery) ||
      fact.key.toLowerCase().includes(normalizedQuery) ||
      fact.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery)) ||
      fact.metadata?.description?.toLowerCase().includes(normalizedQuery) ||
      fact.metadata?.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Finds similar facts by value (including aliases)
 */
export function findSimilarFactsImpl(worldId: EntityID, value: string, facts: Record<EntityID, LoreFact>): LoreFact[] {
  const worldFacts = Object.values(facts).filter((fact) => fact.worldId === worldId);
  const normalizedValue = normalizeText(value, NORM_NAME).toLowerCase();

  return worldFacts.filter((fact) => {
    const normalizedFactValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
    const normalizedAliases = fact.aliases?.map((a) => normalizeText(a, NORM_NAME).toLowerCase()) || [];
    return normalizedFactValue === normalizedValue || normalizedAliases.some((alias) => alias === normalizedValue);
  });
}

/**
 * Validates fact uniqueness
 */
export function validateFactUniquenessImpl(
  worldId: EntityID,
  key: string,
  value: string,
  facts: Record<EntityID, LoreFact>
): boolean {
  const worldFacts = Object.values(facts).filter((fact) => fact.worldId === worldId);
  return !worldFacts.some((fact) => fact.key === key && fact.value === value);
}

/**
 * Validates a lore key format
 *
 * Accepts:
 * - Structured keys: worldId:category_name (lowercase + underscores)
 * - Structured keys with UUID: worldId:category_uuid-abc123
 * - Simple lowercase keys: my_key_name
 * - UUIDs: abc123-def456-...
 *
 * Rejects:
 * - Uppercase keys: KEY_NAME, MyKey, KeyName
 * - Keys with special characters: key-name, key.name
 */
export function validateKeyImpl(key: string): boolean {
  if (key.includes(':')) {
    // Structured keys: worldId:category_name or worldId:category_uuid
    const structuredPattern = /^[a-zA-Z0-9_-]+:[a-z0-9_]+(?:_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/;
    return structuredPattern.test(key);
  }

  // Simple keys: lowercase alphanumeric + underscore OR valid UUID
  const normalizedPattern = /^[a-z][a-z0-9_]*$/;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return normalizedPattern.test(key) || uuidPattern.test(key);
}

/**
 * Validates fact structure
 */
export function validateFactImpl(fact: {
  key?: string;
  value?: string;
  category?: string;
  worldId?: string;
}): boolean {
  const validCategories: LoreCategory[] = ['characters', 'locations', 'events', 'rules'];
  if (!fact.key || fact.key.trim() === '') return false;
  if (!fact.value || fact.value.trim() === '') return false;
  if (!fact.category || !validCategories.includes(fact.category as LoreCategory)) return false;
  if (!fact.worldId || fact.worldId.trim() === '') return false;
  return true;
}
