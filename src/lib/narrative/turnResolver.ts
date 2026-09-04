// src/lib/narrative/turnResolver.ts

import type { EntityID } from '@/types/common.types';
import type {
  LostItemMetadata,
  NarrativeGenerationResult,
  NarrativeSegment,
} from '@/types/narrative.types';
import type {
  TurnCommand,
  InitialTurnCommand,
  ItemUseTurnCommand,
  ItemUseTurnOutcome,
  TurnResult,
  ReconciliationError,
} from '@/types/turnResolver.types';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import type { ReconciledSegmentNotes } from '@/lib/narrative/applyWorldClockUpdates';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { applyWorldClockUpdates } from '@/lib/narrative/applyWorldClockUpdates';
import { applyWorldStateThreadUpdates } from '@/lib/narrative/applyWorldStateThreadUpdates';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import { processLostItems } from '@/lib/narrative/itemLossProcessor';
import { itemNamesMatch } from '@/lib/narrative/itemProcessorShared';
import { syncNpcMetadata } from '@/lib/ai/narrativeGenerator.npc';
import { isSessionEndingSegment } from '@/lib/narrative/isSessionEndingSegment';
import { PARTIAL_RECONCILIATION_ERROR } from '@/lib/narrative/narrativeErrors';
import {
  buildWorldClockPromptContext,
  countWorldClockTurns,
  needsSceneTransition,
} from '@/lib/narrative/worldClock';
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
import { useWorldStore } from '@/state/worldStore';
import {
  buildUsageNarrative,
  generateItemUsageNarrative,
} from '@/lib/inventory/itemUsageNarrative';

/**
 * Per-session lock so concurrent resolveTurn calls execute sequentially.
 * Modeled after chainBySession in applyWorldClockUpdates.ts.
 */
const turnLockBySession = new Map<EntityID, Promise<unknown>>();

const recentSceneSegments = (
  segments: readonly NarrativeSegment[],
  limit = 3
): NarrativeSegment[] => {
  const recent = segments.slice(-limit);
  let latestBoundary = -1;
  recent.forEach((segment, index) => {
    if (segment.type === 'transition') latestBoundary = index;
  });
  return latestBoundary >= 0 ? recent.slice(latestBoundary) : recent;
};

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

/**
 * Uses an inventory item as a first-class Turn. Validation, consumption,
 * generation, settlement, and replacement choices share the session lock.
 */
export function resolveItemUseTurn(
  command: ItemUseTurnCommand,
  generator: NarrativeGenerator
): Promise<ItemUseTurnOutcome> {
  return withTurnLock(command.sessionId, () =>
    resolveItemUseTurnInner(command, generator)
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
  const recentSegments = recentSceneSegments(preTurnSnapshot.segments);
  const turnsSinceComplication = computeTurnsSinceComplication(
    [...preTurnSnapshot.segments]
  );
  const currentTurn = preTurnSnapshot.turnIndex + 1;
  const world = worldId ? useWorldStore.getState().worlds[worldId] : undefined;

  const worldClock = isFeatureEnabled('WORLD_CLOCK')
    ? buildWorldClockPromptContext(
        useWorldThreadStore
          .getState()
          .getAll()
          .filter((thread) => thread.sessionId === sessionId),
        currentTurn,
        world?.toneSettings?.customInstructions
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
          ...(needsSceneTransition(worldClock)
            ? { segmentType: 'transition' as const }
            : {}),
        },
      },
      { signal: command.signal, onChunk: command.onChunk, resolverManaged: true }
    ),
    command.signal
  );

  const resultWithInferredLosses = inferMissingItemLosses(result, characterId);

  return commitAndSettleGeneratedTurn({
    result: {
      ...resultWithInferredLosses,
      metadata: {
        ...resultWithInferredLosses.metadata,
        tags: [
          ...(resultWithInferredLosses.metadata.tags || []),
          ...command.skillCheckTags,
        ],
        decisionOutcome: command.decisionOutcome,
        pacingEscalationRequested: command.pacingEscalationRequested,
        fatalRiskAllowed: command.fatalRiskAllowed,
      },
    },
    segmentId: `seg-${worldId}-${command.choiceId}-${Date.now()}`,
    sessionId,
    worldId,
    characterId,
    isFirstSegment: false,
    isFatalCriticalFailure: command.isFatalCriticalFailure,
    playerCharacterName: preTurnSnapshot.character?.name,
  });
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

  const playerCharacterName =
    useCharacterStore.getState().characters[characterId]?.name;
  return commitAndSettleGeneratedTurn({
    result,
    segmentId: `seg-${worldId}-${Date.now()}`,
    sessionId,
    worldId,
    characterId,
    isFirstSegment: true,
    isFatalCriticalFailure: false,
    playerCharacterName,
  });
}

async function resolveItemUseTurnInner(
  command: ItemUseTurnCommand,
  generator: NarrativeGenerator
): Promise<ItemUseTurnOutcome> {
  const { sessionId, worldId, characterId, itemId } = command;
  const generationError = useNarrativeStore.getState().generationError;
  const activeSessionId = useSessionStore.getState().id;

  if (
    sessionId === activeSessionId &&
    generationError === PARTIAL_RECONCILIATION_ERROR
  ) {
    return validationFailure(generationError.title, generationError.message);
  }

  const world = useWorldStore.getState().worlds[worldId];
  const character = useCharacterStore.getState().characters[characterId];

  if (!world) {
    return validationFailure(
      'World Not Found',
      'The world for this item-use turn could not be found.'
    );
  }

  if (!character || character.worldId !== worldId) {
    return validationFailure(
      'Character Not Found',
      'The character for this item-use turn could not be found in this world.'
    );
  }

  const inventoryStore = useInventoryStore.getState();
  const currentItem = inventoryStore.items[itemId];
  const item = currentItem
    ? {
        ...currentItem,
        acquisitionHistory: [...currentItem.acquisitionHistory],
        categorization: { ...currentItem.categorization },
      }
    : undefined;
  const usage = inventoryStore.useItem(characterId, itemId);

  if (!usage.success || !item) {
    return {
      success: false,
      error: usage.error ?? {
        type: 'VALIDATION',
        title: 'Item Not Found',
        message: 'The specified item could not be found.',
      },
    };
  }

  const usageDetails = {
    wasConsumed: usage.wasConsumed,
    remainingQuantity: usage.remainingQuantity,
    previousQuantity: usage.previousQuantity,
  };
  const generated = await generateItemUsageNarrative(
    { item, characterId, worldId, sessionId, usageDetails },
    generator
  );
  const content = generated.content?.trim()
    ? generated.content
    : buildUsageNarrative(item, usageDetails, 'detailed');
  const tags = new Set(['item-usage', item.categoryId]);
  generated.metadata.tags.forEach((tag) => tags.add(tag));
  const characterIds = generated.metadata.characterIds.length
    ? generated.metadata.characterIds
    : [characterId];
  const result = inferMissingItemLosses(
    {
      ...generated,
      content,
      metadata: {
        ...generated.metadata,
        tags: [...tags],
        characterIds,
      },
    },
    characterId
  );

  const turn = await commitAndSettleGeneratedTurn({
    result,
    segmentId: `seg-${worldId}-item-${itemId}-${Date.now()}`,
    sessionId,
    worldId,
    characterId,
    isFirstSegment: false,
    isFatalCriticalFailure: false,
    playerCharacterName: character.name,
    reconciliationPolicy: {
      skipItemAcquisition: true,
      excludedItemLoss: usage.wasConsumed
        ? { id: item.id, name: item.name }
        : undefined,
    },
  });

  if (turn.status === 'partial') {
    useNarrativeStore
      .getState()
      .setGenerationError(PARTIAL_RECONCILIATION_ERROR);
  }

  if (turn.status === 'settled' && !turn.isEnding) {
    await replaceChoicesAfterItemUse(command, item.id, turn, generator);
  }

  return {
    success: true,
    item,
    usage: { ...usage, success: true },
    turn,
  };
}

function inferMissingItemLosses(
  result: NarrativeGenerationResult,
  characterId: EntityID
): NarrativeGenerationResult {
  if (result.metadata.itemsLost?.length || !result.content) {
    return result;
  }

  const characterInventory = useInventoryStore
    .getState()
    .getCharacterItems(characterId);
  const inferredLosses = inferItemsLostFromNarrative(
    result.content,
    characterInventory
  );

  if (inferredLosses.length === 0) {
    return result;
  }

  return {
    ...result,
    metadata: { ...result.metadata, itemsLost: inferredLosses },
  };
}

function validationFailure(
  title: string,
  message: string
): ItemUseTurnOutcome {
  return {
    success: false,
    error: { type: 'VALIDATION', title, message },
  };
}

async function replaceChoicesAfterItemUse(
  command: ItemUseTurnCommand,
  itemId: EntityID,
  turn: TurnResult,
  generator: NarrativeGenerator
): Promise<void> {
  const { sessionId, worldId, characterId } = command;
  const recentSegments = [...turn.snapshot.segments.slice(-5)];
  const lastSegment = recentSegments[recentSegments.length - 1];

  try {
    const decision = await generator.generatePlayerChoices(
      worldId,
      {
        worldId,
        sessionId,
        currentSceneId: `item-usage-${itemId}-${Date.now()}`,
        characterIds: [characterId],
        previousSegments: recentSegments,
        recentSegments,
        currentTags: lastSegment?.metadata?.tags || [],
        currentLocation: lastSegment?.metadata?.location,
      },
      [characterId],
      sessionId,
      turn.snapshot
    );

    const narrativeStore = useNarrativeStore.getState();
    narrativeStore.clearSessionDecisions(sessionId);
    narrativeStore.addDecision(sessionId, {
      prompt: decision.prompt,
      options: decision.options,
      decisionWeight: decision.decisionWeight,
      contextSummary: decision.contextSummary,
    });
  } catch (error) {
    logger.warn(
      '[TurnResolver] Failed to replace choices after item use:',
      error
    );
  }
}

interface ReconciliationPolicy {
  skipItemAcquisition?: boolean;
  excludedItemLoss?: { id: EntityID; name: string };
}

interface CommitAndSettleParams {
  result: Omit<NarrativeGenerationResult, 'metadata'> & {
    metadata: NarrativeSegment['metadata'];
  };
  segmentId: EntityID;
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  isFirstSegment: boolean;
  isFatalCriticalFailure: boolean;
  playerCharacterName?: string;
  reconciliationPolicy?: ReconciliationPolicy;
}

async function commitAndSettleGeneratedTurn({
  result,
  segmentId,
  sessionId,
  worldId,
  characterId,
  isFirstSegment,
  isFatalCriticalFailure,
  playerCharacterName,
  reconciliationPolicy,
}: CommitAndSettleParams): Promise<TurnResult> {
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
  const { notes, errors, acquiredItems } = await reconcileCoreSideEffects({
    segment: storedSegment,
    segmentId: storedSegmentId,
    sessionId,
    characterId,
    metadata: result.metadata,
    isFirstSegment,
    policy: reconciliationPolicy,
  });

  syncNpcMetadata(worldId, result.metadata.characters);

  if (isFeatureEnabled('SETTLED_COMMITMENT_CHOICES')) {
    await extractAndStoreLore(
      result,
      { worldId, sessionId, characterIds: characterId ? [characterId] : [] },
      playerCharacterName,
      acquiredItems
    );
  } else {
    void extractAndStoreLore(
      result,
      { worldId, sessionId, characterIds: characterId ? [characterId] : [] },
      playerCharacterName,
      acquiredItems
    );
  }

  const settledSegment =
    useNarrativeStore.getState().segments[storedSegmentId] ?? storedSegment;

  return {
    segment: settledSegment,
    status: errors.length === 0 ? 'settled' : 'partial',
    snapshot: assembleSessionSnapshot(sessionId, { worldId, characterId }),
    isFatal:
      isFatalCriticalFailure ||
      settledSegment.metadata?.tags?.includes('fatal-outcome') === true,
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
  policy?: ReconciliationPolicy;
}

interface ReconcileResult {
  notes: ReconciledSegmentNotes | null;
  errors: ReconciliationError[];
  acquiredItems: Array<{ id: EntityID; name: string }>;
}

async function reconcileCoreSideEffects({
  segment,
  segmentId,
  sessionId,
  characterId,
  metadata,
  isFirstSegment,
  policy,
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
  let acquiredItems: Array<{ id: EntityID; name: string }> = [];
  try {
    if (
      !policy?.skipItemAcquisition &&
      metadata.itemsAcquired &&
      metadata.itemsAcquired.length > 0
    ) {
      acquiredItems = await processAcquiredItems(
        metadata.itemsAcquired,
        characterId,
        sessionId,
        (error) =>
          recordError(
            'itemAcquisition',
            '[TurnResolver] Item acquisition failed:',
            error
          ),
        segmentId
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
    const itemsLost = await filterExplicitItemLoss(
      metadata.itemsLost ?? [],
      policy?.excludedItemLoss
    );
    if (itemsLost.length > 0) {
      await processLostItems(
        itemsLost,
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

  return { notes, errors, acquiredItems };
}

async function filterExplicitItemLoss(
  itemsLost: LostItemMetadata[],
  excludedItem?: { id: EntityID; name: string }
): Promise<LostItemMetadata[]> {
  if (!excludedItem) {
    return itemsLost;
  }

  const filteredItems: LostItemMetadata[] = [];

  for (const item of itemsLost) {
    const matchesExplicitUse =
      item.itemId === excludedItem.id ||
      (!item.itemId && await itemNamesMatch(item.name, excludedItem.name));

    if (!matchesExplicitUse) {
      filteredItems.push(item);
    }
  }

  return filteredItems;
}

/**
 * Lore extraction helper. When SETTLED_COMMITMENT_CHOICES is on, the turn
 * awaits this before returning the snapshot; when off, it runs in the background.
 * In either mode, extraction failure is logged and fails open.
 */
async function extractAndStoreLore(
  result: { content: string; metadata: { continuity?: { remainingIssues?: Array<{ type: string; entity: string }> } } },
  request: { worldId: EntityID; sessionId: EntityID; characterIds: string[] },
  playerCharacterName?: string,
  acquiredItems?: Array<{ id: EntityID; name: string }>
): Promise<void> {
  if (!result.content) return;

  try {
    const existingLoreContext = getLoreContextForPrompt(request.worldId, request.sessionId, {
      recordUsage: false,
    });

    const unattestedSpeakers = (
      result.metadata.continuity?.remainingIssues ?? []
    )
      .filter((issue) => issue.type === 'invented-exchange')
      .map((issue) => issue.entity);

    const structuredLore = await extractStructuredLore(result.content, existingLoreContext, {
      continuityTopics: collectContinuityTopicsFromStores(request),
      playerCharacterName,
      ...(unattestedSpeakers.length > 0 ? { unattestedSpeakers } : {}),
      acquiredItems,
    });

    const { useLoreStore } = await import('@/state/loreStore');
    const { addStructuredLore } = useLoreStore.getState();
    addStructuredLore(structuredLore, request.worldId, request.sessionId);
  } catch (error) {
    logger.warn('[TurnResolver] Lore extraction failed:', error);
  }
}
