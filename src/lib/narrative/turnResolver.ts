// src/lib/narrative/turnResolver.ts

import type { EntityID } from '@/types/common.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import type {
  TurnCommand,
  InitialTurnCommand,
  TurnResult,
  ReconciliationError,
} from '@/types/turnResolver.types';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import type { ReconciledSegmentNotes } from '@/lib/narrative/applyWorldClockUpdates';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { applyWorldClockUpdates } from '@/lib/narrative/applyWorldClockUpdates';
import { applyWorldStateThreadUpdates } from '@/lib/narrative/applyWorldStateThreadUpdates';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import { processLostItems } from '@/lib/narrative/itemLossProcessor';
import { syncNpcMetadata } from '@/lib/ai/narrativeGenerator.npc';
import { isSessionEndingSegment } from '@/lib/narrative/isSessionEndingSegment';
import { countWorldClockTurns } from '@/lib/narrative/worldClock';
import { buildWorldClockPromptContext } from '@/lib/narrative/worldClock';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { computeTurnsSinceComplication } from '@/lib/narrative/turnsSinceComplication';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { assembleSessionSnapshot } from '@/lib/narrative/sessionSnapshotAssembler';
import { extractStructuredLore } from '@/lib/ai/structuredLoreExtractor';
import { getLoreContextForPrompt } from '@/lib/ai/loreContextHelper';
import { collectContinuityTopicsFromStores } from '@/lib/ai/narrativeGenerator.continuity';
import { logger } from '@/lib/utils/logger';
import { inferItemsLostFromNarrative } from '@/lib/narrative/itemLossInference';
import { mergeTurnTags } from '@/lib/narrative/turnTags';
import { useInventoryStore } from '@/state/inventoryStore';

/**
 * Per-session lock so concurrent resolveTurn calls execute sequentially.
 * Modeled after chainBySession in applyWorldClockUpdates.ts.
 */
const turnLockBySession = new Map<EntityID, Promise<unknown>>();

function withTurnLock<T>(
  sessionId: EntityID,
  fn: () => Promise<T>
): Promise<T> {
  const prev = turnLockBySession.get(sessionId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  turnLockBySession.set(sessionId, next);
  // Clean up the reference once the chain settles, but only if nothing
  // new appended while this link was running. The .catch suppresses the
  // dangling rejection on the cleanup branch -- the caller's own await
  // handles the real error.
  const cleanup = next.finally(() => {
    if (turnLockBySession.get(sessionId) === next) {
      turnLockBySession.delete(sessionId);
    }
  });
  cleanup.catch(() => {});
  return next;
}

function getAbortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }

  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

/**
 * Makes cancellation authoritative at the pre-commit generation seam even
 * when a downstream provider or formatter ignores the signal itself.
 */
function awaitGeneration<T>(
  startGeneration: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(getAbortError(signal));
  }

  const generation = startGeneration();
  if (!signal) {
    return generation;
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener('abort', handleAbort);
      reject(getAbortError(signal));
    };

    signal.addEventListener('abort', handleAbort, { once: true });
    generation.then(
      (result) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(result);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      }
    );
  });
}

/**
 * Advance the story by one Turn. Handles everything between "the player
 * picked a choice" and "the next Decision can safely read state":
 *
 * 1. Acquire per-session lock
 * 2. Call the generator with resolverManaged flag (skips its side effects)
 * 3. Build and commit the NarrativeSegment
 * 4. Await core reconciliation (world clock, world state threads, inventory)
 * 5. Stamp fatal-outcome tags from reconciliation
 * 6. Fire lore extraction (fire-and-forget, not blocking)
 * 7. Assemble post-turn snapshot
 * 8. Release lock
 */
export function resolveTurn(
  command: TurnCommand,
  generator: NarrativeGenerator
): Promise<TurnResult> {
  return withTurnLock(command.sessionId, () =>
    resolveTurnInner(command, generator)
  );
}

/**
 * First turn of a session - generates the initial scene. Same settlement
 * guarantees as resolveTurn.
 */
export function resolveInitialTurn(
  command: InitialTurnCommand,
  generator: NarrativeGenerator
): Promise<TurnResult> {
  return withTurnLock(command.sessionId, () =>
    resolveInitialTurnInner(command, generator)
  );
}

// -- Internal implementation --------------------------------------------------

async function resolveTurnInner(
  command: TurnCommand,
  generator: NarrativeGenerator
): Promise<TurnResult> {
  const { sessionId, worldId, characterId } = command;
  const ids = { worldId, characterId };

  // Pre-turn snapshot for prompt context
  const preTurnSnapshot = assembleSessionSnapshot(sessionId, ids);
  const recentSegments = preTurnSnapshot.segments.slice(-3);
  const turnsSinceComplication = computeTurnsSinceComplication(
    [...preTurnSnapshot.segments]
  );
  const currentTurn = preTurnSnapshot.turnIndex + 1;

  const worldClock = isFeatureEnabled('WORLD_CLOCK')
    ? buildWorldClockPromptContext(
        useWorldThreadStore
          .getState()
          .getAll()
          .filter((thread) => thread.sessionId === sessionId),
        currentTurn
      )
    : undefined;

  // Build skill check context string for the AI prompt
  let skillCheckContext = '';
  if (command.skillCheckResults.length > 0) {
    const descriptions = command.skillCheckResults.map((r) => {
      if (r.isCriticalSuccess) return `${r.skillName}: CRITICAL SUCCESS (natural 20)`;
      if (r.isCriticalFailure) return `${r.skillName}: CRITICAL FAILURE (natural 1)`;
      if (r.success) return `${r.skillName}: SUCCESS (rolled ${r.total} vs DC ${r.dc})`;
      return `${r.skillName}: FAILURE (rolled ${r.total} vs DC ${r.dc})`;
    });
    skillCheckContext = ` [Skill checks: ${descriptions.join(', ')}]`;
  }

  // Call the generator with resolverManaged so it skips its own
  // fire-and-forget side effects (lore, inventory, NPC sync).
  const result = await awaitGeneration(
    () => generator.generateSegment(
      {
        worldId,
        sessionId,
        characterIds: characterId ? [characterId] : [],
        narrativeContext: {
          worldId,
          currentSceneId: `scene-${Date.now()}`,
          characterIds: characterId ? [characterId] : [],
          previousSegments: [...recentSegments],
          currentTags: mergeTurnTags(
            recentSegments[recentSegments.length - 1]?.metadata?.tags ?? [],
            command.skillCheckTags
          ),
          sessionId,
          recentSegments: [...recentSegments],
          turnsSinceComplication,
          worldClock,
          currentSituation: `Player chose: "${command.choiceText}"${skillCheckContext}`,
        },
        generationParameters: {
          includedTopics: command.generationParams?.includedTopics ?? [command.choiceText],
          decisionWeight: command.decisionWeight,
          desiredTone: command.generationParams?.desiredTone,
        },
      },
      { signal: command.signal, onChunk: command.onChunk, resolverManaged: true }
    ),
    command.signal
  );

  // Infer item losses from the narrative text when the AI didn't tag them
  let metadata = { ...result.metadata };
  if (
    (!metadata.itemsLost || metadata.itemsLost.length === 0) &&
    result.content
  ) {
    const characterInventory = useInventoryStore
      .getState()
      .getCharacterItems(characterId);
    const inferredLosses = inferItemsLostFromNarrative(
      result.content,
      characterInventory
    );
    if (inferredLosses.length > 0) {
      metadata = { ...metadata, itemsLost: inferredLosses };
    }
  }

  // Build the segment
  const segmentId = `seg-${worldId}-${command.choiceId}-${Date.now()}`;
  const now = new Date();
  const newSegment: NarrativeSegment = {
    id: segmentId,
    content: result.content,
    type: result.segmentType,
    characterIds: metadata.characterIds || [],
    metadata: {
      ...metadata,
      tags: [...(metadata.tags || []), ...command.skillCheckTags],
      decisionOutcome: command.decisionOutcome,
      pacingEscalationRequested: command.pacingEscalationRequested,
      fatalRiskAllowed: command.fatalRiskAllowed,
    },
    sessionId,
    worldId,
    timestamp: now,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Commit the segment. The resolverManaged flag tells addSegment to skip
  // its own fire-and-forget tails; the resolver handles those below.
  const storedSegmentId = useNarrativeStore.getState().addSegment(
    sessionId,
    {
      content: newSegment.content,
      type: newSegment.type,
      characterIds: newSegment.characterIds || [],
      metadata: newSegment.metadata,
      worldId: newSegment.worldId,
      updatedAt: newSegment.updatedAt,
      timestamp: newSegment.timestamp,
    },
    { resolverManaged: true }
  );

  // Read back the gated version (addSegment runs content dedup/sanitization)
  const storedSegment =
    useNarrativeStore.getState().segments[storedSegmentId] ?? newSegment;

  // -- Core reconciliation: awaited, not fire-and-forget --

  const { notes, errors } = await reconcileCoreSideEffects({
    segment: storedSegment,
    segmentId: storedSegmentId,
    sessionId,
    characterId,
    metadata,
    isFirstSegment: false,
  });

  // Synchronous NPC sync (already not fire-and-forget)
  syncNpcMetadata(worldId, result.metadata.characters);

  // Fire lore extraction as fire-and-forget. It doesn't block the turn
  // but still runs so facts introduced in this turn's prose are
  // available to later prompts.
  fireLoreExtraction(
    result,
    { worldId, sessionId, characterIds: characterId ? [characterId] : [] },
    preTurnSnapshot.character?.name
  );

  // Read the settled segment after reconciliation may have stamped tags
  const settledSegment =
    useNarrativeStore.getState().segments[storedSegmentId] ?? storedSegment;

  // Post-turn snapshot: the settled revision
  const postTurnSnapshot = assembleSessionSnapshot(sessionId, ids);

  // isFatal reports whether a fatal outcome was detected, but does NOT
  // fold into isEnding unconditionally. The controller decides what to
  // do with a fatal flag based on its own handler availability.
  const isFatal =
    command.isFatalCriticalFailure ||
    settledSegment.metadata?.tags?.includes('fatal-outcome') === true;
  const isEnding = isSessionEndingSegment(settledSegment);

  return {
    segment: settledSegment,
    status: errors.length === 0 ? 'settled' : 'partial',
    snapshot: postTurnSnapshot,
    isFatal,
    isEnding,
    reconciledNotes: notes ?? undefined,
    reconciliationErrors: errors,
  };
}

async function resolveInitialTurnInner(
  command: InitialTurnCommand,
  generator: NarrativeGenerator
): Promise<TurnResult> {
  const { sessionId, worldId, characterId } = command;
  const ids = { worldId, characterId };

  // Recheck inside the lock: if another instance already committed an
  // opening segment while this request was queued, skip generation.
  const existingSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
  if (existingSegments.length > 0) {
    const existing = existingSegments[0];
    return {
      segment: existing,
      status: 'settled',
      snapshot: assembleSessionSnapshot(sessionId, ids),
      isFatal: false,
      isEnding: isSessionEndingSegment(existing),
      reconciliationErrors: [],
    };
  }

  const result = await awaitGeneration(
    () => generator.generateInitialScene(
      worldId,
      characterId ? [characterId] : [],
      sessionId,
      { signal: command.signal, onChunk: command.onChunk, resolverManaged: true }
    ),
    command.signal
  );

  const segmentId = `seg-${worldId}-${Date.now()}`;
  const now = new Date();
  const newSegment: NarrativeSegment = {
    id: segmentId,
    content: result.content,
    type: result.segmentType,
    characterIds: result.metadata.characterIds || [],
    metadata: result.metadata,
    sessionId,
    worldId,
    timestamp: now,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const storedSegmentId = useNarrativeStore.getState().addSegment(
    sessionId,
    {
      content: newSegment.content,
      type: newSegment.type,
      characterIds: newSegment.characterIds || [],
      metadata: newSegment.metadata,
      worldId: newSegment.worldId,
      updatedAt: newSegment.updatedAt,
      timestamp: newSegment.timestamp,
    },
    { resolverManaged: true }
  );

  const storedSegment =
    useNarrativeStore.getState().segments[storedSegmentId] ?? newSegment;

  const { notes, errors } = await reconcileCoreSideEffects({
    segment: storedSegment,
    segmentId: storedSegmentId,
    sessionId,
    characterId,
    metadata: result.metadata,
    isFirstSegment: true,
  });

  syncNpcMetadata(worldId, result.metadata.characters);

  const playerCharacterName =
    useCharacterStore.getState().characters[characterId]?.name;
  fireLoreExtraction(
    result,
    { worldId, sessionId, characterIds: characterId ? [characterId] : [] },
    playerCharacterName
  );

  const settledSegment =
    useNarrativeStore.getState().segments[storedSegmentId] ?? storedSegment;

  const postTurnSnapshot = assembleSessionSnapshot(sessionId, ids);

  return {
    segment: settledSegment,
    status: errors.length === 0 ? 'settled' : 'partial',
    snapshot: postTurnSnapshot,
    isFatal: false,
    isEnding: isSessionEndingSegment(settledSegment),
    reconciledNotes: notes ?? undefined,
    reconciliationErrors: errors,
  };
}

/**
 * The core side effects that MUST complete before the next Decision reads
 * state. Each was previously fire-and-forget; the resolver awaits them.
 * Errors are captured per-step rather than aborting the whole turn.
 */
interface ReconcileParams {
  segment: NarrativeSegment;
  segmentId: EntityID;
  sessionId: EntityID;
  characterId: EntityID;
  metadata: NarrativeSegment['metadata'];
  isFirstSegment: boolean;
}

interface ReconcileResult {
  notes: ReconciledSegmentNotes | null;
  errors: ReconciliationError[];
}

async function reconcileCoreSideEffects({
  segment,
  segmentId,
  sessionId,
  characterId,
  metadata,
  isFirstSegment,
}: ReconcileParams): Promise<ReconcileResult> {
  const errors: ReconciliationError[] = [];
  const recordError = (
    step: ReconciliationError['step'],
    message: string,
    error: unknown
  ) => {
    logger.warn(message, error);
    errors.push({ step, error });
  };

  // 1. World clock: goals, thread extraction, world cost, fatal tag
  const allSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
  const currentTurn = countWorldClockTurns(allSegments);
  let notes: ReconciledSegmentNotes | null = null;

  try {
    const result = await applyWorldClockUpdates({
      segment,
      sessionId,
      characterId: metadata.characterIds?.[0],
      playerCharacterId: characterId,
      currentTurn,
      onError: (error) =>
        recordError(
          'worldClock',
          '[TurnResolver] World clock reconciliation failed:',
          error
        ),
    });

    if (result) {
      notes = result;
      const current = useNarrativeStore.getState().segments[segmentId];
      if (current) {
        const currentTags = current.metadata?.tags ?? [];
        const tags =
          result.worldCost?.fatal && !currentTags.includes('fatal-outcome')
            ? [...currentTags, 'fatal-outcome']
            : currentTags;
        useNarrativeStore.getState().updateSegment(segmentId, {
          metadata: { ...current.metadata, ...result, tags },
        });
      }
    }
  } catch (error) {
    recordError(
      'worldClock',
      '[TurnResolver] World clock reconciliation failed:',
      error
    );
  }

  // 2. World state threads: player threads, relationships, major events
  try {
    await applyWorldStateThreadUpdates({
      newSegment: segment,
      originalSegmentData: {
        content: segment.content,
        type: segment.type,
        characterIds: segment.characterIds,
        metadata: segment.metadata,
        worldId: segment.worldId,
        timestamp: segment.timestamp,
        updatedAt: segment.updatedAt ?? new Date().toISOString(),
      },
      finalMetadata: segment.metadata,
      sessionId,
      isFirstSegment,
      characterId,
      onError: (error) =>
        recordError(
          'worldStateThreads',
          '[TurnResolver] World state thread update failed:',
          error
        ),
    });
  } catch (error) {
    recordError(
      'worldStateThreads',
      '[TurnResolver] World state thread update failed:',
      error
    );
  }

  // 3. Inventory mutations
  try {
    if (metadata.itemsAcquired && metadata.itemsAcquired.length > 0) {
      await processAcquiredItems(
        metadata.itemsAcquired,
        characterId,
        sessionId,
        (error) =>
          recordError(
            'itemAcquisition',
            '[TurnResolver] Item acquisition failed:',
            error
          )
      );
    }
  } catch (error) {
    recordError(
      'itemAcquisition',
      '[TurnResolver] Item acquisition failed:',
      error
    );
  }

  try {
    if (metadata.itemsLost && metadata.itemsLost.length > 0) {
      await processLostItems(
        metadata.itemsLost,
        characterId,
        sessionId,
        (error) =>
          recordError(
            'itemLoss',
            '[TurnResolver] Item loss processing failed:',
            error
          )
      );
    }
  } catch (error) {
    recordError(
      'itemLoss',
      '[TurnResolver] Item loss processing failed:',
      error
    );
  }

  return { notes, errors };
}

/**
 * Fire lore extraction as fire-and-forget. The turn doesn't block on it,
 * but it still runs so facts introduced in this segment's prose are
 * available to later prompts and continuity checks.
 */
function fireLoreExtraction(
  result: { content: string; metadata: { continuity?: { remainingIssues?: Array<{ type: string; entity: string }> } } },
  request: { worldId: EntityID; sessionId: EntityID; characterIds: string[] },
  playerCharacterName?: string
): void {
  if (!result.content) return;

  const existingLoreContext = getLoreContextForPrompt(request.worldId, request.sessionId, {
    recordUsage: false,
  });

  const unattestedSpeakers = (
    result.metadata.continuity?.remainingIssues ?? []
  )
    .filter((issue) => issue.type === 'invented-exchange')
    .map((issue) => issue.entity);

  void extractStructuredLore(result.content, existingLoreContext, {
    continuityTopics: collectContinuityTopicsFromStores(request),
    playerCharacterName,
    ...(unattestedSpeakers.length > 0 ? { unattestedSpeakers } : {}),
  })
    .then(async (structuredLore) => {
      const { useLoreStore } = await import('@/state/loreStore');
      const { addStructuredLore } = useLoreStore.getState();
      addStructuredLore(structuredLore, request.worldId, request.sessionId);
    })
    .catch((error) => {
      logger.warn('[TurnResolver] Lore extraction failed:', error);
    });
}
