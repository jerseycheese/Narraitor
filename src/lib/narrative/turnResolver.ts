// src/lib/narrative/turnResolver.ts

import type { EntityID } from '@/types/common.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import type {
  TurnCommand,
  InitialTurnCommand,
  TurnResult,
  SessionSnapshot,
} from '@/types/turnResolver.types';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import type { ReconciledSegmentNotes } from '@/lib/narrative/applyWorldClockUpdates';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
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
import {
  markResolverActive,
  markResolverInactive,
} from '@/lib/narrative/resolverGuard';
import { logger } from '@/lib/utils/logger';
import { inferItemsLostFromNarrative } from '@/lib/narrative/itemLossInference';
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
  // dangling rejection on the cleanup branch — the caller's own await
  // handles the real error.
  const cleanup = next.finally(() => {
    if (turnLockBySession.get(sessionId) === next) {
      turnLockBySession.delete(sessionId);
    }
  });
  cleanup.catch(() => {});
  return next;
}

/**
 * Read-only session snapshot, for prompt projections or DevTools.
 */
export function readSnapshot(sessionId: EntityID): SessionSnapshot {
  return assembleSessionSnapshot(sessionId);
}

/**
 * Advance the story by one Turn. Handles everything between "the player
 * picked a choice" and "the next Decision can safely read state":
 *
 * 1. Acquire per-session lock
 * 2. Mark the session resolver-active (generator/addSegment skip side effects)
 * 3. Call the generator (prompt building + Gemini call)
 * 4. Build and commit the NarrativeSegment
 * 5. Await core reconciliation (world clock, world state threads, inventory)
 * 6. Stamp fatal-outcome tags from reconciliation
 * 7. Assemble post-turn snapshot
 * 8. Release lock
 * 9. Fire-and-forget background work (lore extraction handled by generator
 *    outside the guard, if needed in the future)
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

  markResolverActive(sessionId);
  try {
    // Pre-turn snapshot for prompt context
    const preTurnSnapshot = assembleSessionSnapshot(sessionId);
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

    // Call the generator - with the resolver active, it returns the result
    // without running its own fire-and-forget side effects.
    const result = await generator.generateSegment(
      {
        worldId,
        sessionId,
        characterIds: characterId ? [characterId] : [],
        narrativeContext: {
          worldId,
          currentSceneId: `scene-${Date.now()}`,
          characterIds: characterId ? [characterId] : [],
          previousSegments: [...recentSegments],
          currentTags: command.skillCheckTags,
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
      { signal: command.signal, onChunk: command.onChunk }
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

    // Build the segment (this construction was in NarrativeController lines 830-850)
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

    // Commit the segment to the narrative store. With the resolver guard
    // active, addSegment does the synchronous write and skips its own
    // fire-and-forget tails.
    const storedSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
      content: newSegment.content,
      type: newSegment.type,
      characterIds: newSegment.characterIds || [],
      metadata: newSegment.metadata,
      worldId: newSegment.worldId,
      updatedAt: newSegment.updatedAt,
      timestamp: newSegment.timestamp,
    });

    // Read back the gated version (addSegment runs content dedup/sanitization)
    const storedSegment =
      useNarrativeStore.getState().segments[storedSegmentId] ?? newSegment;

    // -- Core reconciliation: awaited, not fire-and-forget --

    const reconciledNotes = await reconcileCoreSideEffects({
      segment: storedSegment,
      segmentId: storedSegmentId,
      sessionId,
      characterId,
      metadata,
      isFirstSegment: false,
    });

    // Synchronous NPC sync (already not fire-and-forget)
    syncNpcMetadata(worldId, result.metadata.characters);

    // Read the settled segment after reconciliation may have stamped tags
    const settledSegment =
      useNarrativeStore.getState().segments[storedSegmentId] ?? storedSegment;

    // Post-turn snapshot: the settled revision
    const postTurnSnapshot = assembleSessionSnapshot(sessionId);

    const isFatal =
      command.isFatalCriticalFailure ||
      settledSegment.metadata?.tags?.includes('fatal-outcome') === true;
    const isEnding = isSessionEndingSegment(settledSegment) || isFatal;

    return {
      segment: settledSegment,
      snapshot: postTurnSnapshot,
      isFatal,
      isEnding,
      reconciledNotes: reconciledNotes ?? undefined,
    };
  } finally {
    markResolverInactive(sessionId);
  }
}

async function resolveInitialTurnInner(
  command: InitialTurnCommand,
  generator: NarrativeGenerator
): Promise<TurnResult> {
  const { sessionId, worldId, characterId } = command;

  markResolverActive(sessionId);
  try {
    const result = await generator.generateInitialScene(
      worldId,
      characterId ? [characterId] : [],
      sessionId,
      { signal: command.signal, onChunk: command.onChunk }
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

    const storedSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
      content: newSegment.content,
      type: newSegment.type,
      characterIds: newSegment.characterIds || [],
      metadata: newSegment.metadata,
      worldId: newSegment.worldId,
      updatedAt: newSegment.updatedAt,
      timestamp: newSegment.timestamp,
    });

    const storedSegment =
      useNarrativeStore.getState().segments[storedSegmentId] ?? newSegment;

    const reconciledNotes = await reconcileCoreSideEffects({
      segment: storedSegment,
      segmentId: storedSegmentId,
      sessionId,
      characterId,
      metadata: result.metadata,
      isFirstSegment: true,
    });

    syncNpcMetadata(worldId, result.metadata.characters);

    const settledSegment =
      useNarrativeStore.getState().segments[storedSegmentId] ?? storedSegment;

    const postTurnSnapshot = assembleSessionSnapshot(sessionId);

    return {
      segment: settledSegment,
      snapshot: postTurnSnapshot,
      isFatal: false,
      isEnding: isSessionEndingSegment(settledSegment),
      reconciledNotes: reconciledNotes ?? undefined,
    };
  } finally {
    markResolverInactive(sessionId);
  }
}

/**
 * The core side effects that MUST complete before the next Decision reads
 * state. Each was previously fire-and-forget; the resolver awaits them.
 */
interface ReconcileParams {
  segment: NarrativeSegment;
  segmentId: EntityID;
  sessionId: EntityID;
  characterId: EntityID;
  metadata: NarrativeSegment['metadata'];
  isFirstSegment: boolean;
}

async function reconcileCoreSideEffects({
  segment,
  segmentId,
  sessionId,
  characterId,
  metadata,
  isFirstSegment,
}: ReconcileParams): Promise<ReconciledSegmentNotes | null> {
  // 1. World clock: goals, thread extraction, world cost, fatal tag
  const allSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
  const currentTurn = countWorldClockTurns(allSegments);
  const session = useSessionStore.getState();
  let notes: ReconciledSegmentNotes | null = null;

  try {
    const result = await applyWorldClockUpdates({
      segment,
      sessionId,
      characterId: metadata.characterIds?.[0],
      playerCharacterId:
        session.id === sessionId ? session.characterId ?? undefined : undefined,
      currentTurn,
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
    logger.warn('[TurnResolver] World clock reconciliation failed:', error);
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
    });
  } catch (error) {
    logger.warn('[TurnResolver] World state thread update failed:', error);
  }

  // 3. Inventory mutations
  try {
    if (metadata.itemsAcquired && metadata.itemsAcquired.length > 0) {
      await processAcquiredItems(metadata.itemsAcquired, characterId, sessionId);
    }
  } catch (error) {
    logger.warn('[TurnResolver] Item acquisition failed:', error);
  }

  try {
    if (metadata.itemsLost && metadata.itemsLost.length > 0) {
      await processLostItems(metadata.itemsLost, characterId, sessionId);
    }
  } catch (error) {
    logger.warn('[TurnResolver] Item loss processing failed:', error);
  }

  return notes;
}
