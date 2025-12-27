/**
 * Entity resolution helpers for lore store
 * Focused on MVP/KISS: high-confidence auto-merge and reference updates
 */

import type { EntityID } from '../types/common.types';
import type { LoreCategory, LoreFact, LoreSource, EntityResolutionResult, EntityMatch } from '../types/lore.types';
import { calculateStringSimilarity, findPotentialDuplicates } from '@/lib/lore/fuzzyMatcher';
import { generateLoreKey } from './loreStore.helpers';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp, safeTrim } from '@/lib/utils';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';

const AUTO_MERGE_THRESHOLD = 0.85;
const MATCH_THRESHOLD = 0.6;

const CATEGORY_KEY_MAP: Record<LoreCategory, string> = {
  characters: 'character',
  locations: 'location',
  events: 'event',
  rules: 'rule',
};

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

function normalizeName(value: string): string {
  return normalizeText(value, NORM_NAME).toLowerCase();
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

export interface ReferenceUpdateContext {
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
}

export function updateEntityReferencesImpl(
  worldId: EntityID,
  fromNames: string[],
  toName: string,
  context: ReferenceUpdateContext
): number {
  const normalizedFrom = new Set(
    fromNames.map((name) => normalizeName(name)).filter(Boolean)
  );
  const normalizedTo = normalizeName(toName);

  if (!normalizedTo || normalizedFrom.size === 0) {
    return 0;
  }

  let updatedCount = 0;
  const facts = context.getFacts({ worldId });

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

    context.updateFact(fact.id, {
      metadata: {
        ...fact.metadata,
        relatedEntities: deduped,
      },
    });

    updatedCount++;
  }

  return updatedCount;
}

export interface EntityMatchOptions {
  minConfidence?: number;
  category?: LoreCategory;
}

export function findPotentialEntityMatchesImpl(
  worldId: EntityID,
  context: { getFacts: (options?: { worldId?: EntityID }) => LoreFact[] },
  options?: EntityMatchOptions
): EntityMatch[] {
  const matches = findPotentialDuplicates(
    context.getFacts({ worldId }),
    worldId,
    {
      minConfidence: options?.minConfidence ?? MATCH_THRESHOLD,
      category: options?.category,
    }
  );

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
}
