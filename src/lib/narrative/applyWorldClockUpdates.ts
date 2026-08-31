import type { NarrativeSegment } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type {
  WorldClockSegmentNote,
  WorldThreadExtractionInput,
  WorldThreadSeedContext,
  WorldThreadSegmentSignals,
} from '@/types/worldThread.types';
import type { WorldCostExtractionInput, WorldCostSegmentNote } from '@/types/worldCost.types';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { isWorldClockTurnSegment, summarizeLedgerForSegment } from '@/lib/narrative/worldClock';
import { applyWorldCost } from '@/lib/narrative/applyWorldCost';
import { useCharacterStore } from '@/state/characterStore';
import { useGoalStore } from '@/state/goalStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';

export interface ApplyWorldClockUpdatesParams {
  segment: NarrativeSegment;
  sessionId: EntityID;
  /** What the goal path has always been handed: the first id in the segment's `characterIds` (an NPC in the scene), kept as is. */
  characterId?: EntityID;
  /** The session's player character; the cost channel reads and writes this one, never a scene NPC. */
  playerCharacterId?: EntityID;
  /** 1-based index of this segment in the session, read after it was added. */
  currentTurn: number;
  /** Reports a fail-open extraction so an awaited caller can mark the Turn partial. */
  onError?: (error: unknown) => void;
}

/** What the one extraction call reconciled this turn; each member stamps its own metadata field. */
export interface ReconciledSegmentNotes {
  worldClock?: WorldClockSegmentNote;
  worldCost?: WorldCostSegmentNote;
}

/**
 * Extraction is fire-and-forget and the next turn can land before the last
 * one resolves. Running a session's extractions one at a time keeps the
 * ledger reconciling in turn order (a slow turn 2 can't overwrite what turn 3
 * already applied) and lets each call read the ledger the previous one
 * wrote, which is also what stops an unseeded session seeding twice.
 */
const chainBySession = new Map<EntityID, Promise<unknown>>();

/**
 * Runs the one post-segment extraction call (goals plus, when the world clock
 * is on, the thread ledger, plus, when the cost channel is on, what the world
 * took) and reconciles each from what it returns. Resolves to the notes that
 * get stamped on the segment, or undefined when both flags are off or nothing
 * could be reconciled. Fail-open throughout: the goal path behaves exactly as
 * it did before either existed.
 */
export function applyWorldClockUpdates(
  params: ApplyWorldClockUpdatesParams
): Promise<ReconciledSegmentNotes | undefined> {
  const previous = chainBySession.get(params.sessionId) ?? Promise.resolve();
  const current = previous.then(
    () => reconcileSegment(params),
    () => reconcileSegment(params)
  );
  chainBySession.set(params.sessionId, current);
  // Both branches settle, so a rejected extraction never leaves this cleanup
  // promise dangling as an unhandled rejection; the caller handles `current`.
  const releaseTail = () => {
    if (chainBySession.get(params.sessionId) === current) {
      chainBySession.delete(params.sessionId);
    }
  };
  current.then(releaseTail, releaseTail);
  return current;
}

async function reconcileSegment({
  segment,
  sessionId,
  characterId,
  playerCharacterId,
  currentTurn,
  onError,
}: ApplyWorldClockUpdatesParams): Promise<ReconciledSegmentNotes | undefined> {
  const goalStore = useGoalStore.getState();
  const clockOn = isFeatureEnabled('WORLD_CLOCK') && isWorldClockTurnSegment(segment);
  const costOn = isFeatureEnabled('WORLD_COST');

  if (!clockOn && !costOn) {
    await goalStore.processSegmentForGoals(segment, sessionId, characterId);
    return undefined;
  }

  const worldId = segment.worldId ?? useSessionStore.getState().worldId ?? undefined;
  const worldThreads = clockOn ? buildThreadInput(sessionId, worldId, currentTurn, segment) : undefined;
  const worldCost = costOn && playerCharacterId ? buildCostInput(playerCharacterId, segment) : undefined;

  try {
    const result = await goalStore.processSegmentForGoals(segment, sessionId, characterId, worldThreads, worldCost);
    const notes: ReconciledSegmentNotes = {};

    // Cost before ledger. A cost is attributed to a thread that was open while
    // the segment was being written, and recordThreadCost takes only an open
    // thread, so applying the extraction first drops the cost on exactly the
    // turn this channel exists to catch: the one where a thread lands and takes
    // something. The extractor can only cite ids it was handed, so nothing it
    // attributes can belong to a thread opened by this same result.
    if (result.worldCost && playerCharacterId) {
      notes.worldCost = applyWorldCost({ sessionId, characterId: playerCharacterId, result: result.worldCost });
    }

    if (clockOn && result.worldThreads && worldId) {
      const applied = useWorldThreadStore
        .getState()
        .applyExtraction(sessionId, worldId, result.worldThreads, currentTurn);
      const sessionThreads = useWorldThreadStore
        .getState()
        .getAll()
        .filter((thread) => thread.sessionId === sessionId);
      notes.worldClock = summarizeLedgerForSegment(sessionThreads, currentTurn, applied);
    }

    return notes.worldClock || notes.worldCost ? notes : undefined;
  } catch (error) {
    logger.warn('[WorldClock] Ledger reconciliation failed', { sessionId, error });
    onError?.(error);
    return undefined;
  }
}

function buildThreadInput(
  sessionId: EntityID,
  worldId: EntityID | undefined,
  currentTurn: number,
  segment: NarrativeSegment
): WorldThreadExtractionInput {
  const threadStore = useWorldThreadStore.getState();
  return {
    openThreads: threadStore.getOpenThreadsBySession(sessionId),
    currentTurn,
    segmentSignals: collectSegmentSignals(segment),
    seed: threadStore.hasSessionLedger(sessionId) ? undefined : buildSeedContext(worldId, sessionId),
  };
}

/** What the character carries and what the scene took this turn, so the extractor records against real state. */
function buildCostInput(characterId: EntityID, segment: NarrativeSegment): WorldCostExtractionInput | undefined {
  const character = useCharacterStore.getState().characters[characterId];
  if (!character) return undefined;
  return {
    conditions: character.status.conditions,
    itemsLost: segment.metadata?.itemsLost?.map((item) => item.name) ?? [],
  };
}

function collectSegmentSignals(segment: NarrativeSegment): WorldThreadSegmentSignals | undefined {
  const metadata = segment.metadata;
  if (!metadata) return undefined;
  const signals: WorldThreadSegmentSignals = {
    location: metadata.location,
    itemsAcquired: metadata.itemsAcquired?.map((item) => item.name),
    itemsLost: metadata.itemsLost?.map((item) => item.name),
    decisionOutcome: metadata.decisionOutcome,
    majorEvent: metadata.majorEvent,
  };
  return Object.values(signals).some((value) => value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0))
    ? signals
    : undefined;
}

/**
 * The world already carries its pressure sources as prose; the seed hands the
 * extractor that prose plus the player's goals and lets it name the threads.
 */
function buildSeedContext(worldId: EntityID | undefined, sessionId: EntityID): WorldThreadSeedContext {
  const world = worldId ? useWorldStore.getState().worlds[worldId] : undefined;
  const activeGoals = useGoalStore
    .getState()
    .getActiveGoalsBySession(sessionId)
    .map((goal) => goal.contextSummary || goal.title);
  return {
    worldDescription: world?.description,
    toneInstructions: world?.toneSettings?.customInstructions,
    activeGoals,
  };
}
