/**
 * Turn arithmetic over the world-thread ledger. Pure functions: the store
 * owns the data, the scene prompt and the segment stamp consume these shapes.
 */
import type {
  WorldThread,
  WorldClockPromptContext,
  WorldClockSegmentNote,
} from '@/types/worldThread.types';

const DEFAULT_PROMPT_THREAD_CAP = 8;

/**
 * Turns a thread may sit overdue before the scene prompt stops asking and
 * starts insisting. Round 5's overdue mark fired the turn after the due and
 * kept the same wording for 25 turns, so it stopped carrying information;
 * a short grace period keeps a rough due from forcing the payoff too early
 * and makes the DUE NOW instruction mean it.
 */
export const DUE_NOW_OVERDUE_TURNS = 3;

/**
 * The nearest a due may be filed. The model read "end of next week" as one
 * turn out; anything closer than this is the current scene, not a deadline
 * the world is holding.
 */
export const MIN_DUE_HORIZON_TURNS = 2;

/**
 * The fuse on a landed thread. Round 9 let a thread that had arrived stand in
 * the scene indefinitely (the creature inside the shed for eight turns, three
 * actors in the council chamber for thirteen); the judge asked for a fuse.
 * Firing re-files the due this many turns out, and at that due the block
 * demands the strike, the cost or the outcome rather than the arrival.
 */
export const FIRED_THREAD_FUSE_TURNS = 3;

export const isOverdue = (thread: WorldThread, currentTurn: number): boolean =>
  thread.status === 'open' && thread.dueByTurn !== undefined && currentTurn > thread.dueByTurn;

export const overdueByTurns = (thread: WorldThread, currentTurn: number): number =>
  isOverdue(thread, currentTurn) ? currentTurn - (thread.dueByTurn as number) : 0;

/**
 * A fired thread's due is the fuse the store set, exact rather than a model
 * estimate, so it is eligible the turn it reaches it with no grace. An
 * unfired thread keeps the grace period on its rough due.
 */
const isDueNowEligible = (thread: WorldThread, currentTurn: number): boolean =>
  thread.firedAtTurn !== undefined
    ? thread.dueByTurn !== undefined && currentTurn >= thread.dueByTurn
    : overdueByTurns(thread, currentTurn) >= DUE_NOW_OVERDUE_TURNS;

/**
 * At most one thread is forced to land per segment: asking the model to pay
 * off four overdue threads at once reads the same as asking for none. A fired
 * thread at its fuse wins over an unfired overdue one (the thing already in
 * the room acts before the next thing arrives); within each group the most
 * overdue wins, the oldest on a tie.
 */
export const selectDueNowThread = (
  openThreads: WorldThread[],
  currentTurn: number
): WorldThread | undefined =>
  openThreads
    .filter((thread) => isDueNowEligible(thread, currentTurn))
    .sort(
      (a, b) =>
        Number(b.firedAtTurn !== undefined) - Number(a.firedAtTurn !== undefined) ||
        overdueByTurns(b, currentTurn) - overdueByTurns(a, currentTurn) ||
        a.openedAtTurn - b.openedAtTurn
    )[0];

/**
 * Turns since the ledger last moved in any direction. Resolved threads count:
 * a payoff last turn means the world just moved even if nothing is open now.
 */
export const turnsSinceWorldMoved = (threads: WorldThread[], currentTurn: number): number => {
  if (threads.length === 0) return 0;
  const lastMovedTurn = Math.max(
    ...threads.map((thread) => Math.max(thread.lastAdvancedAtTurn, thread.openedAtTurn))
  );
  return Math.max(0, currentTurn - lastMovedTurn);
};

/**
 * Overdue threads first (the debts the story is most behind on), then the
 * oldest open ones, capped so a long ledger can't swamp the scene prompt.
 */
export const selectThreadsForPrompt = (
  openThreads: WorldThread[],
  currentTurn: number,
  cap: number = DEFAULT_PROMPT_THREAD_CAP
): WorldThread[] =>
  [...openThreads]
    .sort((a, b) => {
      const overdueDelta = Number(isOverdue(b, currentTurn)) - Number(isOverdue(a, currentTurn));
      return overdueDelta !== 0 ? overdueDelta : a.openedAtTurn - b.openedAtTurn;
    })
    .slice(0, cap);

export const buildWorldClockPromptContext = (
  sessionThreads: WorldThread[],
  currentTurn: number
): WorldClockPromptContext => {
  const openThreads = sessionThreads.filter((thread) => thread.status === 'open');
  const dueNow = selectDueNowThread(openThreads, currentTurn);
  return {
    currentTurn,
    turnsSinceWorldMoved: turnsSinceWorldMoved(sessionThreads, currentTurn),
    threads: selectThreadsForPrompt(openThreads, currentTurn).map((thread) => ({
      kind: thread.kind,
      summary: thread.summary,
      ageTurns: currentTurn - thread.openedAtTurn,
      overdue: isOverdue(thread, currentTurn),
      overdueByTurns: overdueByTurns(thread, currentTurn),
      dueNow: thread.id === dueNow?.id,
      fired: thread.firedAtTurn !== undefined,
      ...(thread.firedAtTurn !== undefined ? { firedAtTurn: thread.firedAtTurn } : {}),
    })),
  };
};

export const summarizeLedgerForSegment = (
  sessionThreads: WorldThread[],
  currentTurn: number,
  applied: Pick<WorldClockSegmentNote, 'opened' | 'advanced' | 'resolved'>
): WorldClockSegmentNote => {
  const openThreads = sessionThreads.filter((thread) => thread.status === 'open');
  return {
    turn: currentTurn,
    open: openThreads.length,
    overdue: openThreads.filter((thread) => isOverdue(thread, currentTurn)).length,
    opened: applied.opened,
    advanced: applied.advanced,
    resolved: applied.resolved,
  };
};
