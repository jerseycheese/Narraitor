import {
  DUE_NOW_OVERDUE_TURNS,
  OPEN_ASK_QUIET_TURNS,
  buildWorldClockPromptContext,
  countWorldClockTurns,
  isOverdue,
  isWorldClockTurnSegment,
  needsOpenAsk,
  overdueByTurns,
  selectDueNowThread,
  selectThreadsForPrompt,
  summarizeLedgerForSegment,
  turnsSinceWorldMoved,
} from '../worldClock';
import type { NarrativeSegment } from '@/types/narrative.types';
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

const makeSegment = (id: string, tags: string[] = []): NarrativeSegment => ({
  id,
  sessionId: 'session-a',
  worldId: 'world-1',
  content: 'A scene unfolds.',
  type: tags.includes('item-usage') ? 'action' : 'scene',
  metadata: { tags },
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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

  test('selectDueNowThread leaves a fired thread alone until its fuse, then picks it with no grace, ahead of an unfired overdue one', () => {
    // Fired at 8, fused to due 11: turns 9 and 10 are the thread's own; at 11 it is the pick.
    const fired = makeThread({ id: 'fired', openedAtTurn: 1, dueByTurn: 11, firedAtTurn: 8 });
    const later = makeThread({ id: 'later', openedAtTurn: 4, dueByTurn: 5 });
    expect(selectDueNowThread([fired], 10)).toBeUndefined();
    expect(selectDueNowThread([fired], 11)?.id).toBe('fired');
    expect(selectDueNowThread([fired, later], 11)?.id).toBe('fired');
    expect(selectDueNowThread([later], 11)?.id).toBe('later');
    expect(selectDueNowThread([fired, later], 10)?.id).toBe('later');
  });

  test('selectDueNowThread takes the most overdue fired thread first, oldest on a tie', () => {
    const young = makeThread({ id: 'young', openedAtTurn: 5, dueByTurn: 12, firedAtTurn: 9 });
    const old = makeThread({ id: 'old', openedAtTurn: 2, dueByTurn: 12, firedAtTurn: 9 });
    const longest = makeThread({ id: 'longest', openedAtTurn: 6, dueByTurn: 10, firedAtTurn: 7 });
    expect(selectDueNowThread([young, old, longest], 12)?.id).toBe('longest');
    expect(selectDueNowThread([young, old], 12)?.id).toBe('old');
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
        { kind: 'consequence', summary: 'The vote', ageTurns: 6, overdue: true, overdueByTurns: 2, dueNow: false, fired: false, strikes: 0 },
        {
          kind: 'consequence',
          summary: 'The debt collector is coming',
          ageTurns: 5,
          overdue: true,
          overdueByTurns: 3,
          dueNow: true,
          fired: false,
          strikes: 0,
        },
      ],
    });
  });

  test('buildWorldClockPromptContext carries the world\'s tone line as the register, and leaves it off when blank', () => {
    const threads = [makeThread({ summary: 'The vote', openedAtTurn: 1, dueByTurn: 5 })];

    expect(buildWorldClockPromptContext(threads, 3, '  never from violence ').register).toBe('never from violence');
    expect(buildWorldClockPromptContext(threads, 3, '   ')).not.toHaveProperty('register');
    expect(buildWorldClockPromptContext(threads, 3)).not.toHaveProperty('register');
  });

  test('buildWorldClockPromptContext marks a fired thread by its own summary, never its notes, and hands it the pick at its fuse', () => {
    const threads = [
      makeThread({
        summary: 'Henderson comes to collect',
        openedAtTurn: 1,
        dueByTurn: 15,
        firedAtTurn: 12,
        notes: ['Henderson stepped forward (was: those owed favors collect)', 'The ledger is on the table'],
      }),
      makeThread({ summary: 'The agreement is signed', openedAtTurn: 2, dueByTurn: 4 }),
    ];

    const before = buildWorldClockPromptContext(threads, 14).threads;
    expect(before[0]).toEqual({
      kind: 'consequence',
      summary: 'The agreement is signed',
      ageTurns: 12,
      overdue: true,
      overdueByTurns: 10,
      dueNow: true,
      fired: false,
      strikes: 0,
    });
    expect(before[1]).toEqual({
      kind: 'consequence',
      summary: 'Henderson comes to collect',
      ageTurns: 13,
      overdue: false,
      overdueByTurns: 0,
      dueNow: false,
      fired: true,
      firedAtTurn: 12,
      strikes: 0,
    });
    expect(JSON.stringify(before)).not.toContain('ledger is on the table');

    const atFuse = buildWorldClockPromptContext(threads, 15).threads;
    expect(atFuse.find((thread) => thread.fired)?.dueNow).toBe(true);
    expect(atFuse.find((thread) => !thread.fired)?.dueNow).toBe(false);
  });

  test('buildWorldClockPromptContext carries a thread\'s strike count into the prompt shape', () => {
    const threads = [makeThread({ summary: 'The thing in the boathouse', dueByTurn: 11, firedAtTurn: 8, strikeCount: 3 })];
    expect(buildWorldClockPromptContext(threads, 11).threads[0].strikes).toBe(3);
  });

  test('needsOpenAsk fires only when the quiet window has passed and nothing unfired is due inside it', () => {
    // Quiet for the window, only a fired thread open: ask.
    const fired = makeThread({ openedAtTurn: 1, dueByTurn: 11, firedAtTurn: 8 });
    expect(needsOpenAsk([fired], 1 + OPEN_ASK_QUIET_TURNS)).toBe(true);
    expect(needsOpenAsk([fired], OPEN_ASK_QUIET_TURNS)).toBe(false);

    // An unfired thread due far out (round 11's vote, due 30) does not block the ask; one due inside the window does.
    const farDue = makeThread({ openedAtTurn: 1, dueByTurn: 30 });
    expect(needsOpenAsk([farDue], 10)).toBe(true);
    const nearDue = makeThread({ openedAtTurn: 1, dueByTurn: 12 });
    expect(needsOpenAsk([nearDue], 10)).toBe(false);

    // A thread with no due can never reach DUE NOW, so it does not block; a recent open resets the window even if resolved since.
    const noDue = makeThread({ openedAtTurn: 1 });
    expect(needsOpenAsk([noDue], 10)).toBe(true);
    const recentlyOpenedResolved = makeThread({ openedAtTurn: 8, status: 'resolved' });
    expect(needsOpenAsk([fired, recentlyOpenedResolved], 10)).toBe(false);

    // An empty session is the seed path's, not the ask's.
    expect(needsOpenAsk([], 10)).toBe(false);
  });

  test('countWorldClockTurns treats item usage as a beat, not a clock turn', () => {
    const opening = makeSegment('seg-1');
    const itemUse = makeSegment('seg-2', ['item-usage', 'quest-items']);
    const nextScene = makeSegment('seg-3');

    expect(isWorldClockTurnSegment(opening)).toBe(true);
    expect(isWorldClockTurnSegment(itemUse)).toBe(false);
    expect(countWorldClockTurns([opening, itemUse, nextScene])).toBe(2);
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
