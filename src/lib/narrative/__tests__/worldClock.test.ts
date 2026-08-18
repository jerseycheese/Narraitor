import {
  isOverdue,
  overdueByTurns,
  turnsSinceWorldMoved,
  selectThreadsForPrompt,
  selectDueNowThread,
  buildWorldClockPromptContext,
  summarizeLedgerForSegment,
  DUE_NOW_OVERDUE_TURNS,
} from '../worldClock';
import type { WorldThread } from '@/types/worldThread.types';

let nextId = 0;
const makeThread = (overrides: Partial<WorldThread> = {}): WorldThread => ({
  id: `thread-${++nextId}`,
  sessionId: 'session-a',
  worldId: 'world-1',
  kind: 'consequence',
  summary: `Thread ${nextId}`,
  openedAtTurn: 1,
  lastAdvancedAtTurn: 1,
  status: 'open',
  notes: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('worldClock', () => {
  test.each([
    ['open past its due turn', { dueByTurn: 3 }, 4, true],
    ['open on its due turn', { dueByTurn: 3 }, 3, false],
    ['open with no due turn', {}, 40, false],
    ['resolved past its due turn', { dueByTurn: 3, status: 'resolved' as const }, 4, false],
  ])('isOverdue: %s', (_label, overrides, currentTurn, expected) => {
    expect(isOverdue(makeThread(overrides), currentTurn)).toBe(expected);
  });

  test.each([
    ['no threads', [], 5, 0],
    ['an open thread advanced two turns ago', [makeThread({ lastAdvancedAtTurn: 3 })], 5, 2],
    [
      'a resolved thread counts as movement',
      [makeThread({ lastAdvancedAtTurn: 1 }), makeThread({ status: 'resolved', lastAdvancedAtTurn: 5 })],
      5,
      0,
    ],
    ['a thread opened after its last advance', [makeThread({ openedAtTurn: 4, lastAdvancedAtTurn: 1 })], 6, 2],
  ])('turnsSinceWorldMoved: %s', (_label, threads, currentTurn, expected) => {
    expect(turnsSinceWorldMoved(threads, currentTurn)).toBe(expected);
  });

  test('selectThreadsForPrompt puts overdue first, then oldest, and honors the cap', () => {
    const young = makeThread({ id: 'young', openedAtTurn: 8 });
    const old = makeThread({ id: 'old', openedAtTurn: 2 });
    const overdue = makeThread({ id: 'overdue', openedAtTurn: 5, dueByTurn: 6 });
    const middle = makeThread({ id: 'middle', openedAtTurn: 4 });

    const ordered = selectThreadsForPrompt([young, old, overdue, middle], 10).map((t) => t.id);
    expect(ordered).toEqual(['overdue', 'old', 'middle', 'young']);

    expect(selectThreadsForPrompt([young, old, overdue, middle], 10, 2).map((t) => t.id)).toEqual([
      'overdue',
      'old',
    ]);
  });

  test.each([
    ['not overdue', { dueByTurn: 6 }, 6, 0],
    ['no due turn', {}, 20, 0],
    ['three turns past due', { dueByTurn: 3 }, 6, 3],
  ])('overdueByTurns: %s', (_label, overrides, currentTurn, expected) => {
    expect(overdueByTurns(makeThread(overrides), currentTurn)).toBe(expected);
  });

  test('selectDueNowThread waits out the grace period, then picks the most overdue thread, oldest on a tie', () => {
    const barelyOverdue = makeThread({ id: 'barely', openedAtTurn: 2, dueByTurn: 9 });
    expect(selectDueNowThread([barelyOverdue], 10)).toBeUndefined();
    expect(selectDueNowThread([barelyOverdue], 9 + DUE_NOW_OVERDUE_TURNS)).toBe(barelyOverdue);

    const mostOverdue = makeThread({ id: 'most', openedAtTurn: 5, dueByTurn: 6 });
    const tiedYounger = makeThread({ id: 'tied-young', openedAtTurn: 7, dueByTurn: 8 });
    const tiedOlder = makeThread({ id: 'tied-old', openedAtTurn: 3, dueByTurn: 8 });
    const noDue = makeThread({ id: 'no-due', openedAtTurn: 1 });
    expect(selectDueNowThread([tiedYounger, noDue, mostOverdue, tiedOlder], 12)?.id).toBe('most');
    expect(selectDueNowThread([tiedYounger, noDue, tiedOlder], 12)?.id).toBe('tied-old');
    expect(selectDueNowThread([noDue], 40)).toBeUndefined();
  });

  test('buildWorldClockPromptContext renders open threads with age, overdue arithmetic and one due-now pick', () => {
    const threads = [
      makeThread({ summary: 'The debt collector is coming', openedAtTurn: 2, dueByTurn: 4 }),
      makeThread({ summary: 'The vote', openedAtTurn: 1, dueByTurn: 5 }),
      makeThread({ summary: 'The bridge is out', status: 'resolved', lastAdvancedAtTurn: 5 }),
    ];

    expect(buildWorldClockPromptContext(threads, 7)).toEqual({
      currentTurn: 7,
      turnsSinceWorldMoved: 2,
      threads: [
        { kind: 'consequence', summary: 'The vote', ageTurns: 6, overdue: true, overdueByTurns: 2, dueNow: false },
        {
          kind: 'consequence',
          summary: 'The debt collector is coming',
          ageTurns: 5,
          overdue: true,
          overdueByTurns: 3,
          dueNow: true,
        },
      ],
    });
  });

  test('summarizeLedgerForSegment counts open and overdue and passes the applied summaries through', () => {
    const threads = [
      makeThread({ dueByTurn: 2 }),
      makeThread(),
      makeThread({ status: 'dropped' }),
    ];
    const applied = { opened: ['A'], advanced: [], resolved: ['B'] };

    expect(summarizeLedgerForSegment(threads, 5, applied)).toEqual({
      turn: 5,
      open: 2,
      overdue: 1,
      opened: ['A'],
      advanced: [],
      resolved: ['B'],
    });
  });
});
