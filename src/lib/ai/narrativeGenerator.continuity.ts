/**
 * Continuity guardrail wiring for narrative generation (#409/#412).
 *
 * Owns the store reads and the single corrective AI call so the pure
 * detection logic in `lib/lore/continuityGuardrail.ts` stays store-free.
 * Everything here is fail-open: any error leaves the generated segment
 * untouched — continuity checking must never block the player.
 */

import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { useLoreStore } from '@/state/loreStore';
import { useContinuityStore } from '@/state/continuityStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { logger } from '@/lib/utils/logger';
import type { AIClient } from './types';
import type { EntityID } from '@/types/common.types';
import type {
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
} from '@/types/narrative.types';
import type { LoreFact } from '@/types/lore.types';
import type {
  ContinuityContract,
  ContinuityRecentDecision,
  ContinuitySegmentNote,
  ContinuityValidationResult,
} from '@/types/continuity.types';
import {
  buildContinuityContract,
  buildContinuityCorrectionPrompt,
  collectContinuityTopics,
  detectContinuityIssues,
  formatContinuityExpectations,
  isContinuityContractEmpty,
} from '@/lib/lore/continuityGuardrail';

const CORRECTION_TIMEOUT_MS = 8000;

/**
 * Recent decisions come from the request context (segments already carry
 * `causedByDecisionText` / `decisionOutcome` from addSegment's decision
 * linking) rather than a narrativeStore read, which would add a new
 * lib/ai -> state edge for data the request already has.
 */
const collectRecentDecisions = (
  request: NarrativeGenerationRequest
): ContinuityRecentDecision[] => {
  const decisions: ContinuityRecentDecision[] = [];
  for (const segment of request.narrativeContext?.previousSegments ?? []) {
    const text = segment?.metadata?.causedByDecisionText;
    if (text) {
      decisions.push({ text, outcome: segment.metadata?.decisionOutcome });
    }
  }
  const currentSituation = request.narrativeContext?.currentSituation;
  if (currentSituation?.startsWith('Player chose')) {
    decisions.push({ text: currentSituation });
  }
  return decisions;
};

const readSessionFacts = (request: NarrativeGenerationRequest): LoreFact[] => {
  const loreStoreState = useLoreStore.getState();
  return typeof loreStoreState.getFacts === 'function'
    ? (loreStoreState.getFacts({
        worldId: request.worldId,
        sessionId: request.sessionId,
      }) ?? [])
    : [];
};

/**
 * Topic labels already in the ledger, handed to the lore extractor so a
 * repeated question lands on the same label. Empty on any store failure.
 */
export const collectContinuityTopicsFromStores = (
  request: NarrativeGenerationRequest
): string[] => {
  try {
    return collectContinuityTopics(readSessionFacts(request));
  } catch {
    return [];
  }
};

/**
 * Builds the continuity contract from live stores. Returns null when the
 * contract would be vacuous (nothing to validate against) or when any store
 * read fails — a null contract disables the guardrail for this request.
 */
export const buildContinuityContractFromStores = (
  request: NarrativeGenerationRequest,
  options?: { playerName?: string }
): ContinuityContract | null => {
  try {
    const worldStoreState = useWorldStore.getState();
    const worldState =
      typeof worldStoreState.getWorldState === 'function'
        ? worldStoreState.getWorldState(request.worldId)
        : undefined;
    const npcRelationships = worldState?.npcRelationships ?? {};

    const npcNames: Record<EntityID, string> = {};
    const npcStoreState = useNPCStore.getState();
    if (typeof npcStoreState.getNPCsByWorld === 'function') {
      for (const npc of npcStoreState.getNPCsByWorld(request.worldId) ?? []) {
        if (npc?.id && npc?.name) {
          npcNames[npc.id] = npc.name;
        }
      }
    }

    const contract = buildContinuityContract({
      facts: readSessionFacts(request),
      npcRelationships,
      npcNames,
      recentDecisions: collectRecentDecisions(request),
      playerName: options?.playerName,
    });

    if (isContinuityContractEmpty(contract)) {
      return null;
    }
    return contract;
  } catch (error) {
    logger.warn('[ContinuityGuardrail] Failed to build contract', { error });
    return null;
  }
};

/**
 * Prevention layer: appends the contract's expectations to the generation
 * prompt so the model is less likely to contradict state in the first place.
 */
export const enhancePromptWithContinuityExpectations = (
  prompt: string,
  contract: ContinuityContract | null
): string => {
  if (!contract) return prompt;
  const expectations = formatContinuityExpectations(contract);
  if (!expectations) return prompt;
  return `${prompt}\n\n${expectations}`;
};

const raceWithTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Continuity correction timed out')),
          ms
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Push a validation result into the continuity store for the DevTools panel.
 * Browser + non-production only; failures are swallowed so that observability
 * never interferes with narrative generation.
 */
const publishContinuityResult = (result: ContinuityValidationResult): void => {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }
  try {
    useContinuityStore.getState().recordResult(result);
  } catch {
    // Intentionally ignored — observability must never break generation.
  }
};

const withContinuityNote = (
  result: NarrativeGenerationResult,
  note: ContinuitySegmentNote
): NarrativeGenerationResult => ({
  ...result,
  metadata: {
    ...result.metadata,
    continuity: note,
  },
});

/**
 * Runtime check on the formatted segment prose. Deterministic detection is
 * the fast path; when an issue is found, one corrective AI call rewrites the
 * segment, and the corrected text is adopted only if it strictly reduces the
 * issue count. Otherwise the original ships flagged (visible in DevTools).
 */
export const applyContinuityGuardrail = async (options: {
  result: NarrativeGenerationResult;
  contract: ContinuityContract | null;
  client: AIClient;
  worldId: EntityID;
  sessionId?: EntityID;
}): Promise<NarrativeGenerationResult> => {
  const { result, contract, client, worldId, sessionId } = options;
  if (!contract || !result.content) {
    return result;
  }

  const detectionStart = Date.now();
  const issues = detectContinuityIssues(result.content, contract);
  const detectionMs = Date.now() - detectionStart;

  if (issues.length === 0) {
    publishContinuityResult({
      id: generateUniqueId('continuity'),
      worldId,
      sessionId,
      status: 'clean',
      issues: [],
      detectionMs,
      timestamp: new Date().toISOString(),
    });
    return withContinuityNote(result, { status: 'clean' });
  }

  const correctionStart = Date.now();
  let correctedContent: string | null = null;
  try {
    const response = await raceWithTimeout(
      client.generateContent(
        buildContinuityCorrectionPrompt(result.content, issues, contract)
      ),
      CORRECTION_TIMEOUT_MS
    );
    correctedContent = response?.content?.trim() || null;
  } catch (error) {
    logger.warn('[ContinuityGuardrail] Correction call failed', { error });
  }
  const correctionMs = Date.now() - correctionStart;

  const remainingIssues = correctedContent
    ? detectContinuityIssues(correctedContent, contract)
    : issues;
  const corrected =
    correctedContent !== null && remainingIssues.length < issues.length;
  const status = corrected ? 'corrected' : 'flagged';

  publishContinuityResult({
    id: generateUniqueId('continuity'),
    worldId,
    sessionId,
    status,
    issues,
    remainingIssues: corrected ? undefined : remainingIssues,
    detectionMs,
    correctionMs,
    timestamp: new Date().toISOString(),
  });

  logger.info('[ContinuityGuardrail] Contradiction handled', {
    worldId,
    sessionId,
    status,
    issueCount: issues.length,
    entities: issues.map((issue) => issue.entity),
  });

  const finalResult =
    corrected && correctedContent !== null
      ? { ...result, content: correctedContent }
      : result;

  return withContinuityNote(finalResult, {
    status,
    issues: issues.map((issue) => ({ type: issue.type, entity: issue.entity })),
  });
};
