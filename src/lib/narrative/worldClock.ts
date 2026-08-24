/**
 * Turn arithmetic over the world-thread ledger. Pure functions: the store
 * owns the data, the scene prompt and the segment stamp consume these shapes.
 */
import type { NarrativeSegment } from '@/types/narrative.types';
import type {
  WorldThread,
  WorldClockPromptContext,
  WorldClockSegmentNote,
} from '@/types/worldThread.types';

const DEFAULT_PROMPT_THREAD_CAP = 8;

export const isOverdue = (thread: WorldThread, currentTurn: number): boolean =>
  thread.status === 'open' && thread.dueByTurn !== undefined && currentTurn > thread.dueByTurn;

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
  return {
    currentTurn,
    turnsSinceWorldMoved: turnsSinceWorldMoved(sessionThreads, currentTurn),
    threads: selectThreadsForPrompt(openThreads, currentTurn).map((thread) => ({
      kind: thread.kind,
      summary: thread.summary,
      ageTurns: currentTurn - thread.openedAtTurn,
      overdue: isOverdue(thread, currentTurn),
    })),
  };
};

export const isWorldClockTurnSegment = (segment: NarrativeSegment): boolean =>
  !segment.metadata?.tags?.includes('item-usage');

export const countWorldClockTurns = (segments: NarrativeSegment[]): number =>
  segments.filter(isWorldClockTurnSegment).length;

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
