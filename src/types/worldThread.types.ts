// src/types/worldThread.types.ts

import { EntityID, TimestampedEntity } from './common.types';

/**
 * The world clock's ledger: things the story owes the player.
 *
 * Not to be confused with `PlayerCharacterThread` in world-state.types.ts,
 * which is a rolling per-character summary. A WorldThread is a single open
 * obligation the world carries between turns: a consequence the player loaded
 * and the world has not yet paid off, an off-screen actor with somewhere to
 * go, or a deadline that has to arrive.
 */
export type WorldThreadKind = 'consequence' | 'actor' | 'deadline';

export type WorldThreadStatus = 'open' | 'resolved' | 'dropped';

export interface WorldThread extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  worldId: EntityID;
  kind: WorldThreadKind;
  /** One line, third person, what is owed. */
  summary: string;
  /** Turn indices, not wall clock: the segment count when it happened. */
  openedAtTurn: number;
  lastAdvancedAtTurn: number;
  /** Rough turn by which the thread should come due, when the prose gives one. */
  dueByTurn?: number;
  /**
   * Set when an advance lands this thread into the scene. From then on its
   * summary replaces the vague opening wording, and once its fuse comes
   * due the block demands its strike, its cost or its outcome.
   */
  firedAtTurn?: number;
  /**
   * Times this thread has acted since it fired (each advance on it while it
   * is the DUE NOW pick re-fuses it and counts one strike). Past the strike
   * cap the block stops demanding another act and demands the matter
   * conclude, so a fired thread has an exit besides resolution or a kill.
   */
  strikeCount?: number;
  status: WorldThreadStatus;
  /** How it came due or closed, set when status leaves 'open'. */
  resolution?: string;
  /** Short notes from each advance, oldest first. */
  notes: string[];
  /** What this thread took from the character, oldest first; most threads never do. */
  costs?: string[];
}

/**
 * What observably changed in the segment being reconciled, from its metadata.
 * The extraction uses it to check that a claimed advance produced a change.
 */
export interface WorldThreadSegmentSignals {
  location?: string;
  itemsAcquired?: string[];
  itemsLost?: string[];
  decisionOutcome?: string;
  majorEvent?: string;
}

/**
 * Seed material for a session whose ledger is still empty: the world's own
 * pressure sources as prose, plus the player's active goals.
 */
export interface WorldThreadSeedContext {
  worldDescription?: string;
  toneInstructions?: string;
  activeGoals: string[];
}

/** Input to the post-segment extraction's world-clock section. */
export interface WorldThreadExtractionInput {
  openThreads: WorldThread[];
  currentTurn: number;
  segmentSignals?: WorldThreadSegmentSignals;
  seed?: WorldThreadSeedContext;
  /** The thread the scene block asked this segment to land, so the extractor matches arrivals to it first. */
  dueNowThreadId?: EntityID;
  /**
   * Set when the ledger has gone quiet: nothing opened for a window of turns
   * and no unfired open thread is due inside it. The extraction section then
   * asks for one new off-stage pressure.
   */
  openAsk?: boolean;
}

/** What the extraction returns for the ledger; every array may be empty. */
export interface WorldThreadExtractionResult {
  opened: Array<{
    kind: WorldThreadKind;
    summary: string;
    dueByTurn?: number;
    /** The open thread this arrival is landing; refines it instead of opening new. */
    covers?: EntityID;
  }>;
  /** An advance must name what is different now; restatements are dropped. */
  advanced: Array<{ id: EntityID; changed: string }>;
  resolved: Array<{ id: EntityID; resolution: string; outcome: 'resolved' | 'dropped' }>;
}

/** What the scene prompt renders. Summaries the model itself wrote plus turn arithmetic. */
export interface WorldClockPromptContext {
  currentTurn: number;
  /** Turns since any thread advanced, resolved, or was opened; 0 on the seed turn. */
  turnsSinceWorldMoved: number;
  /** Tone or register line from world settings; quotes the world's own voice into the strike prompt. */
  register?: string;
  threads: Array<{
    kind: WorldThreadKind;
    summary: string;
    ageTurns: number;
    overdue: boolean;
    overdueByTurns: number;
    /** Single forced thread for this segment; at most one per turn. */
    dueNow: boolean;
    /** Already in the scene; rendered by its own summary with no arrival ask, and picked at its fuse for the strike. */
    fired: boolean;
    firedAtTurn?: number;
    /** Strikes since firing; at the cap the fired DUE NOW ask becomes "conclude", not another strike. */
    strikes: number;
  }>;
}

/**
 * Stamped onto a segment's metadata after extraction reconciles it, so the
 * playtest harness can read the ledger's movement per turn straight off the
 * segment list.
 */
export interface WorldClockSegmentNote {
  turn: number;
  open: number;
  overdue: number;
  opened: string[];
  advanced: string[];
  resolved: string[];
}
