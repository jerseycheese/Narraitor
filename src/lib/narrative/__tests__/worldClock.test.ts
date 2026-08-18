import {
  isOverdue,
  turnsSinceWorldMoved,
  selectThreadsForPrompt,
  buildWorldClockPromptContext,
  summarizeLedgerForSegment,
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

  test('buildWorldClockPromptContext renders open threads with age and overdue flags', () => {
    const threads = [
      makeThread({ summary: 'The debt collector is coming', openedAtTurn: 2, dueByTurn: 4 }),
      makeThread({ summary: 'The bridge is out', status: 'resolved', lastAdvancedAtTurn: 5 }),
    ];

    expect(buildWorldClockPromptContext(threads, 6)).toEqual({
      currentTurn: 6,
      turnsSinceWorldMoved: 1,
      threads: [{ kind: 'consequence', summary: 'The debt collector is coming', ageTurns: 4, overdue: true }],
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
