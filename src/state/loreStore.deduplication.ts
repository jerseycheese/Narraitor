import type { EntityID } from '../types/common.types';
import type {
  LoreFact,
  LoreCategory,
  LoreSource,
  DuplicateMatch,
  LoreMergeAuditEntry,
  EntityMatch,
  EntityResolutionResult,
} from '../types/lore.types';
import {
  findPotentialDuplicates,
  checkFactSimilarity,
  calculateStringSimilarity,
} from '../lib/lore/fuzzyMatcher';
import { logger } from '@/lib/utils/logger';
import { getTimestamp, safeTrim } from '@/lib/utils';
import { generateUniqueId } from '../lib/utils/generateId';
import { ErrorType, type UserFriendlyError } from '@/lib/utils/errorUtils';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { generateLoreKey } from './loreStore.helpers';
import type { LoreStore } from './loreStore';

type SetState = (
  partial: Partial<LoreStore> | ((state: LoreStore) => Partial<LoreStore>)
) => void;
type GetState = () => LoreStore;

const AUTO_MERGE_THRESHOLD = 0.85;
const MATCH_THRESHOLD = 0.6;

const CATEGORY_KEY_MAP: Record<LoreCategory, string> = {
  characters: 'character',
  locations: 'location',
  events: 'event',
  rules: 'rule',
};

const normalizeName = (value: string): string =>
  normalizeText(value, NORM_NAME).toLowerCase();

// ---------- Pure-function impls (kept exported for direct unit testing) ----------

export interface DeduplicationContext {
  getFact: (id: EntityID) => LoreFact | undefined;
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  setAliases: (id: EntityID, aliases: string[]) => void;
  setError: (error: UserFriendlyError | null) => void;
}

export interface MergeResult {
  worldId: EntityID;
  primaryId: EntityID;
  secondaryId: EntityID;
  primaryName: string;
  secondaryName: string;
  secondaryAliases: string[];
  primaryCategory: LoreCategory;
  secondaryCategory: LoreCategory;
  aliasesAdded: string[];
  crossCategory: boolean;
}

export async function scanForDuplicatesImpl(
  worldId: EntityID,
  category: LoreCategory | null,
  context: DeduplicationContext
): Promise<DuplicateMatch[]> {
  try {
    const facts = context.getFacts({ worldId });
    const options = category ? { category } : undefined;
    const duplicates = findPotentialDuplicates(facts, worldId, options);

    logger.info('[LoreStore] Duplicate scan complete', {
      worldId,
      category,
      duplicatesFound: duplicates.length,
    });

    return duplicates;
  } catch (error) {
    logger.error('[LoreStore] Error scanning for duplicates', error);
    context.setError({
      title: 'Duplicate Scan Failed',
      message: 'Failed to scan for duplicates',
      retryable: true,
      type: ErrorType.SERVICE,
    });
    return [];
  }
}

export function mergeFactsImpl(
  primaryId: EntityID,
  secondaryId: EntityID,
  context: DeduplicationContext
): MergeResult {
  if (primaryId === secondaryId) {
    throw new Error('Cannot merge a fact with itself');
  }

  const primaryFact = context.getFact(primaryId);
  const secondaryFact = context.getFact(secondaryId);

  if (!primaryFact) {
    throw new Error(`Primary fact not found: ${primaryId}`);
  }
  if (!secondaryFact) {
    throw new Error(`Secondary fact not found: ${secondaryId}`);
  }
  if (primaryFact.worldId !== secondaryFact.worldId) {
    throw new Error('Cannot merge facts from different worlds');
  }

  try {
    const importanceOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
    const primaryImportance = importanceOrder[primaryFact.metadata?.importance ?? 'undefined'];
    const secondaryImportance = importanceOrder[secondaryFact.metadata?.importance ?? 'undefined'];

    let actualPrimary = primaryFact;
    let actualSecondary = secondaryFact;

    if (secondaryImportance > primaryImportance) {
      actualPrimary = secondaryFact;
      actualSecondary = primaryFact;
    } else if (
      secondaryImportance === primaryImportance &&
      secondaryFact.createdAt < primaryFact.createdAt
    ) {
      actualPrimary = secondaryFact;
      actualSecondary = primaryFact;
    }

    const existingAliases = actualPrimary.aliases || [];

    const mergedAliases = [
      ...existingAliases,
      ...(actualSecondary.aliases || []),
      actualSecondary.value,
    ];

    const uniqueAliases = Array.from(new Set(mergedAliases.map((a) => a.trim())))
      .filter((a) => a.length > 0 && a !== actualPrimary.value);

    const aliasesAdded = uniqueAliases.filter(
      (alias) => !existingAliases.includes(alias)
    );

    const primaryTags = actualPrimary.metadata?.tags || [];
    const secondaryTags = actualSecondary.metadata?.tags || [];
    const mergedTags = Array.from(new Set([...primaryTags, ...secondaryTags]));

    const primaryDesc = actualPrimary.metadata?.description || '';
    const secondaryDesc = actualSecondary.metadata?.description || '';
    const mergedDescription =
      primaryDesc && secondaryDesc
        ? `${primaryDesc}\n\n${secondaryDesc}`
        : primaryDesc || secondaryDesc;

    const actualPrimaryImportance = importanceOrder[actualPrimary.metadata?.importance ?? 'undefined'];
    const actualSecondaryImportance = importanceOrder[actualSecondary.metadata?.importance ?? 'undefined'];
    const mergedImportance =
      actualPrimaryImportance >= actualSecondaryImportance
        ? actualPrimary.metadata?.importance
        : actualSecondary.metadata?.importance;

    context.setAliases(actualPrimary.id, uniqueAliases);

    context.updateFact(actualPrimary.id, {
      metadata: {
        ...actualPrimary.metadata,
        description: mergedDescription || undefined,
        importance: mergedImportance,
        tags: mergedTags.length > 0 ? mergedTags : undefined,
      },
    });

    context.deleteFact(actualSecondary.id);

    logger.info('[LoreStore] Facts merged successfully', {
      primaryId: actualPrimary.id,
      secondaryId: actualSecondary.id,
      aliasesCount: uniqueAliases.length,
    });

    return {
      worldId: actualPrimary.worldId,
      primaryId: actualPrimary.id,
      secondaryId: actualSecondary.id,
      primaryName: actualPrimary.value,
      secondaryName: actualSecondary.value,
      secondaryAliases: actualSecondary.aliases || [],
      primaryCategory: actualPrimary.category,
      secondaryCategory: actualSecondary.category,
      aliasesAdded,
      crossCategory: actualPrimary.category !== actualSecondary.category,
    };
  } catch (error) {
    logger.error('[LoreStore] Error merging facts', error);
    context.setError({
      title: 'Merge Failed',
      message: 'Failed to merge facts',
      retryable: false,
      type: ErrorType.SERVICE,
    });
    throw error;
  }
}

export async function checkDuplicateBeforeCreateImpl(
  value: string,
  category: LoreCategory,
  worldId: EntityID,
  context: DeduplicationContext
): Promise<DuplicateMatch[]> {
  try {
    const existingFacts = context
      .getFacts({ worldId })
      .filter((f) => f.category === category);

    if (existingFacts.length === 0) {
      return [];
    }

    const now = getTimestamp();
    const tempFact: LoreFact = {
      id: 'temp' as EntityID,
      worldId,
      category,
      key: 'temp_key',
      value,
      aliases: [],
      source: 'manual',
      visibility: 'world-shared',
      createdAt: now,
      updatedAt: now,
    };

    const matches: DuplicateMatch[] = [];

    for (const existingFact of existingFacts) {
      const result = await checkFactSimilarity(tempFact, existingFact);

      if (result.isDuplicate || result.confidence >= 0.6) {
        matches.push({
          fact1: existingFact,
          fact2: tempFact,
          confidence: result.confidence,
          method: result.method,
          rationale: result.rationale,
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    logger.error('[LoreStore] Error checking for duplicates', error);
    return [];
  }
}

// ---------- Entity resolution (used by extraction.ts) ----------

export interface EntityResolutionContext {
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  getFact: (id: EntityID) => LoreFact | undefined;
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
  addAlias: (id: EntityID, alias: string) => void;
}

export interface ResolveEntityOptions {
  source: LoreSource;
  sessionId?: EntityID;
  metadata?: LoreFact['metadata'];
  visibility?: 'session-private' | 'world-shared';
  minConfidence?: number;
  autoMergeThreshold?: number;
  allowCrossCategory?: boolean;
}

function findBestMatch(
  name: string,
  candidates: LoreFact[]
): { fact: LoreFact; confidence: number; method: EntityResolutionResult['matchedBy'] } | null {
  const normalizedName = normalizeName(name);
  let best: { fact: LoreFact; confidence: number; method: EntityResolutionResult['matchedBy'] } | null = null;

  for (const fact of candidates) {
    const normalizedValue = normalizeName(fact.value);
    if (normalizedValue === normalizedName) {
      return { fact, confidence: 1, method: 'exact' };
    }

    const normalizedAliases = (fact.aliases || []).map((alias) => normalizeName(alias));
    if (normalizedAliases.includes(normalizedName)) {
      return { fact, confidence: 1, method: 'alias' };
    }

    const similarity = calculateStringSimilarity(fact.value, name);
    if (!best || similarity > best.confidence) {
      best = { fact, confidence: similarity, method: 'levenshtein' };
    }
  }

  return best;
}

export function resolveEntityImpl(
  name: string,
  category: LoreCategory,
  worldId: EntityID,
  options: ResolveEntityOptions,
  context: EntityResolutionContext
): EntityResolutionResult {
  const trimmedName = safeTrim(name).replace(/\s+/g, ' ');
  if (!trimmedName) {
    throw new Error('Entity name is required');
  }

  const allowCrossCategory = options.allowCrossCategory ?? false;
  const minConfidence = options.minConfidence ?? MATCH_THRESHOLD;
  const autoMergeThreshold = options.autoMergeThreshold ?? AUTO_MERGE_THRESHOLD;

  const candidates = context
    .getFacts({ worldId })
    .filter((fact) => allowCrossCategory || fact.category === category);

  const bestMatch = findBestMatch(trimmedName, candidates);

  if (
    bestMatch &&
    (bestMatch.method === 'exact' ||
      bestMatch.method === 'alias' ||
      bestMatch.confidence >= autoMergeThreshold)
  ) {
    if (bestMatch.fact.value !== trimmedName) {
      context.addAlias(bestMatch.fact.id, trimmedName);
    }

    return {
      entity: bestMatch.fact,
      isNew: false,
      confidence: bestMatch.confidence,
      matchedBy: bestMatch.method,
    };
  }

  const softMatch = bestMatch && bestMatch.confidence >= minConfidence;

  const key = generateLoreKey(worldId, CATEGORY_KEY_MAP[category], trimmedName);
  const factId = context.addFact(
    key,
    trimmedName,
    category,
    options.source,
    worldId,
    options.sessionId,
    options.metadata,
    options.visibility
  );
  const createdFact = context.getFact(factId);
  if (!createdFact) {
    const fallback = context
      .getFacts({ worldId })
      .find((fact) => fact.key === key && fact.value === trimmedName);
    if (!fallback) {
      throw new Error('Failed to create lore entity');
    }
    return {
      entity: fallback,
      isNew: false,
      confidence: 1,
      matchedBy: 'exact',
    };
  }

  return {
    entity: createdFact,
    isNew: true,
    confidence: softMatch ? bestMatch.confidence : 1,
    matchedBy: softMatch ? bestMatch.method : undefined,
  };
}

function updateEntityReferences(
  worldId: EntityID,
  fromNames: string[],
  toName: string,
  get: GetState
): number {
  const normalizedFrom = new Set(
    fromNames.map((name) => normalizeName(name)).filter(Boolean)
  );
  const normalizedTo = normalizeName(toName);

  if (!normalizedTo || normalizedFrom.size === 0) {
    return 0;
  }

  let updatedCount = 0;
  const facts = get().getFacts({ worldId });

  for (const fact of facts) {
    const related = fact.metadata?.relatedEntities;
    if (!related || related.length === 0) continue;

    let changed = false;
    const updatedRelated = related.map((entry) => {
      const normalizedEntry = normalizeName(entry);
      if (normalizedFrom.has(normalizedEntry)) {
        changed = true;
        return toName;
      }
      return entry;
    });

    if (!changed) continue;

    const deduped = Array.from(
      new Set(updatedRelated.map((entry) => safeTrim(entry)).filter(Boolean))
    );

    get().update(fact.id, {
      metadata: {
        ...fact.metadata,
        relatedEntities: deduped,
      },
    });

    updatedCount++;
  }

  return updatedCount;
}

// ---------- Action creators ----------

export const createLoreDeduplicationActions = (set: SetState, get: GetState) => {
  const buildContext = (): DeduplicationContext => ({
    getFact: get().getById,
    getFacts: get().getFacts,
    updateFact: get().update,
    deleteFact: get().delete,
    setAliases: get().setAliases,
    setError: get().setError,
  });

  return {
    scanForDuplicates: (worldId: EntityID, category?: LoreCategory) =>
      scanForDuplicatesImpl(worldId, category ?? null, buildContext()),

    mergeFacts: (primaryId: EntityID, secondaryId: EntityID) => {
      const result = mergeFactsImpl(primaryId, secondaryId, buildContext());

      const referencesUpdated = updateEntityReferences(
        result.worldId,
        [result.secondaryName, ...result.secondaryAliases],
        result.primaryName,
        get
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

    checkDuplicateBeforeCreate: (
      value: string,
      category: LoreCategory,
      worldId: EntityID
    ) => checkDuplicateBeforeCreateImpl(value, category, worldId, buildContext()),

    findPotentialEntityMatches: (
      worldId: EntityID,
      options?: { minConfidence?: number; category?: LoreCategory }
    ): EntityMatch[] => {
      const matches = findPotentialDuplicates(get().getFacts({ worldId }), worldId, {
        minConfidence: options?.minConfidence ?? MATCH_THRESHOLD,
        category: options?.category,
      });

      const timestamp = getTimestamp();

      return matches.map((match) => ({
        id: generateUniqueId('match'),
        worldId,
        fact1Id: match.fact1.id,
        fact2Id: match.fact2.id,
        confidence: match.confidence,
        method: match.method,
        rationale: match.rationale,
        crossCategory: match.fact1.category !== match.fact2.category,
        status: 'pending',
        createdAt: timestamp,
      }));
    },
  };
};
