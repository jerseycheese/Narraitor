import { applyWorldClockUpdates } from '../applyWorldClockUpdates';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useGoalStore } from '@/state/goalStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/lib/featureFlags');

const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

const segment = (worldId: string, overrides: Partial<NarrativeSegment> = {}): NarrativeSegment => ({
  id: 'seg-1',
  sessionId: 'session-1',
  worldId,
  content: 'The developer sends word that the offer expires Friday.',
  type: 'scene',
  metadata: { tags: [], location: 'Town hall', majorEvent: 'The offer now has a deadline' },
  timestamp: new Date('2026-08-18T00:00:00.000Z'),
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
  ...overrides,
});

describe('applyWorldClockUpdates', () => {
  let processSpy: jest.SpyInstance;
  let worldId: string;

  beforeEach(() => {
    useWorldThreadStore.setState({ threads: {}, entities: {}, sessionThreads: {} });
    // jest.setup.ts swaps worldStore for its manual mock, which has no
    // setState; seed the one world through the mock's own createWorld.
    (useWorldStore as unknown as { __resetMocks: () => void }).__resetMocks();
    worldId = useWorldStore.getState().createWorld({
      name: 'Harrowgate',
      description: 'The council votes in six weeks.',
      genre: 'modern',
      attributes: [],
      skills: [],
      settings: { maxAttributes: 4, maxSkills: 4, attributePointPool: 20, skillPointPool: 20 },
      toneSettings: { customInstructions: 'civic drama' },
    } as never);
    processSpy = jest
      .spyOn(useGoalStore.getState(), 'processSegmentForGoals')
      .mockResolvedValue({ newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0 });
  });

  afterEach(() => {
    processSpy.mockRestore();
  });

  it('with the flag off, runs goal extraction exactly as before and stamps nothing', async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 1 });

    expect(note).toBeUndefined();
    expect(processSpy).toHaveBeenCalledWith(expect.anything(), 'session-1', undefined);
    expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);
  });

  it('with the flag on, seeds an unseeded session from the world prose and applies the result', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    processSpy.mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: {
        opened: [{ kind: 'deadline', summary: 'The council vote', dueByTurn: 30 }],
        advanced: [],
        resolved: [],
      },
    });

    const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 1 });

    const input = processSpy.mock.calls[0][3];
    expect(input.currentTurn).toBe(1);
    expect(input.seed).toEqual({
      worldDescription: 'The council votes in six weeks.',
      toneInstructions: 'civic drama',
      activeGoals: [],
    });
    expect(input.segmentSignals).toEqual(
      expect.objectContaining({ location: 'Town hall', majorEvent: 'The offer now has a deadline' })
    );
    expect(note).toEqual({ turn: 1, open: 1, overdue: 0, opened: ['The council vote'], advanced: [], resolved: [] });
    expect(useWorldThreadStore.getState().getOpenThreadsBySession('session-1')).toHaveLength(1);
  });

  it('with the flag on and a seeded ledger, passes the open threads and no seed', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    useWorldThreadStore.getState().applyExtraction(
      'session-1',
      worldId,
      { opened: [{ kind: 'actor', summary: 'Davies is out collecting' }], advanced: [], resolved: [] },
      1
    );
    processSpy.mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: { opened: [], advanced: [], resolved: [] },
    });

    const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 2 });

    const input = processSpy.mock.calls[0][3];
    expect(input.seed).toBeUndefined();
    expect(input.openThreads.map((t: { summary: string }) => t.summary)).toEqual(['Davies is out collecting']);
    expect(input.dueNowThreadId).toBeUndefined();
    expect(note).toEqual({ turn: 2, open: 1, overdue: 0, opened: [], advanced: [], resolved: [] });
  });

  it('hands the extraction the same DUE NOW thread the scene block asked to land', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    useWorldThreadStore.getState().applyExtraction(
      'session-1',
      worldId,
      {
        opened: [
          { kind: 'actor', summary: 'Those owed favors come to collect', dueByTurn: 3 },
          { kind: 'deadline', summary: 'The vote in six weeks', dueByTurn: 30 },
        ],
        advanced: [],
        resolved: [],
      },
      1
    );
    processSpy.mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: { opened: [], advanced: [], resolved: [] },
    });

    await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 9 });

    const input = processSpy.mock.calls[0][3];
    const favors = input.openThreads.find((t: { summary: string }) => t.summary === 'Those owed favors come to collect');
    expect(input.dueNowThreadId).toBe(favors.id);
  });

  it('runs a session\'s extractions in turn order, so a fast turn 2 waits for turn 1 and seeds once', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    let releaseTurnOne: (value: unknown) => void = () => undefined;
    processSpy
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseTurnOne = resolve;
          })
      )
      .mockResolvedValueOnce({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldThreads: { opened: [], advanced: [], resolved: [] },
      });

    const turnOne = applyWorldClockUpdates({ segment: segment(worldId, { id: 'seg-1' }), sessionId: 'session-1', currentTurn: 1 });
    const turnTwo = applyWorldClockUpdates({ segment: segment(worldId, { id: 'seg-2' }), sessionId: 'session-1', currentTurn: 2 });
    await Promise.resolve();

    expect(processSpy).toHaveBeenCalledTimes(1);

    releaseTurnOne({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: { opened: [{ kind: 'deadline', summary: 'The council vote', dueByTurn: 30 }], advanced: [], resolved: [] },
    });
    const [noteOne, noteTwo] = await Promise.all([turnOne, turnTwo]);

    expect(processSpy).toHaveBeenCalledTimes(2);
    expect(processSpy.mock.calls[0][3].seed).toBeDefined();
    expect(processSpy.mock.calls[1][3].seed).toBeUndefined();
    expect(processSpy.mock.calls[1][3].openThreads.map((t: { summary: string }) => t.summary)).toEqual(['The council vote']);
    expect(noteOne?.opened).toEqual(['The council vote']);
    expect(noteTwo).toEqual({ turn: 2, open: 1, overdue: 0, opened: [], advanced: [], resolved: [] });
  });

  it('leaves the session unseeded when the extraction returned no ledger block', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 1 });

    expect(note).toBeUndefined();
    expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);
  });
});
