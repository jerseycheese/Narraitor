import type { NarrativeSegment } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type {
  WorldClockSegmentNote,
  WorldThreadExtractionInput,
  WorldThreadSeedContext,
  WorldThreadSegmentSignals,
} from '@/types/worldThread.types';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { summarizeLedgerForSegment } from '@/lib/narrative/worldClock';
import { useGoalStore } from '@/state/goalStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';

export interface ApplyWorldClockUpdatesParams {
  segment: NarrativeSegment;
  sessionId: EntityID;
  characterId?: EntityID;
  /** 1-based index of this segment in the session, read after it was added. */
  currentTurn: number;
}

/**
 * Seeding is fire-and-forget and the next turn can land before the first
 * extraction resolves; without this guard both calls would see an empty
 * ledger and seed it twice.
 */
const seedInFlight = new Set<EntityID>();

/**
 * Runs the one post-segment extraction call (goals plus, when the world clock
 * is on, the thread ledger) and reconciles the ledger from what it returns.
 * Resolves to the note that gets stamped on the segment, or undefined when the
 * clock is off or nothing could be reconciled. Fail-open throughout: the goal
 * path behaves exactly as it did before the clock existed.
 */
export async function applyWorldClockUpdates({
  segment,
  sessionId,
  characterId,
  currentTurn,
}: ApplyWorldClockUpdatesParams): Promise<WorldClockSegmentNote | undefined> {
  const goalStore = useGoalStore.getState();

  if (!isFeatureEnabled('WORLD_CLOCK')) {
    await goalStore.processSegmentForGoals(segment, sessionId, characterId);
    return undefined;
  }

  const worldId = segment.worldId ?? useSessionStore.getState().worldId ?? undefined;
  const threadStore = useWorldThreadStore.getState();
  const openThreads = threadStore.getOpenThreadsBySession(sessionId);
  const needsSeed = !threadStore.hasSessionLedger(sessionId) && !seedInFlight.has(sessionId);

  const worldThreads: WorldThreadExtractionInput = {
    openThreads,
    currentTurn,
    segmentSignals: collectSegmentSignals(segment),
    seed: needsSeed ? buildSeedContext(worldId, sessionId) : undefined,
  };

  if (needsSeed) seedInFlight.add(sessionId);
  try {
    const result = await goalStore.processSegmentForGoals(segment, sessionId, characterId, worldThreads);
    if (!result.worldThreads || !worldId) {
      return undefined;
    }

    const applied = useWorldThreadStore
      .getState()
      .applyExtraction(sessionId, worldId, result.worldThreads, currentTurn);
    const sessionThreads = useWorldThreadStore
      .getState()
      .getAll()
      .filter((thread) => thread.sessionId === sessionId);
    return summarizeLedgerForSegment(sessionThreads, currentTurn, applied);
  } catch (error) {
    logger.warn('[WorldClock] Ledger reconciliation failed', { sessionId, error });
    return undefined;
  } finally {
    if (needsSeed) seedInFlight.delete(sessionId);
  }
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
