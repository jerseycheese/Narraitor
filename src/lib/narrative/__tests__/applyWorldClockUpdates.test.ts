import { applyWorldClockUpdates } from '../applyWorldClockUpdates';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useGoalStore } from '@/state/goalStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import type { Character } from '@/state/characterStore.types';
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
    useWorldThreadStore.setState({ threads: {}, entities: {}, sessionThreads: {}, seedAttempts: {} });
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

  it('reports a fail-open extraction error to an awaited caller', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const extractionError = new Error('clock extraction failed');
    const onError = jest.fn();
    processSpy.mockRejectedValueOnce(extractionError);

    const note = await applyWorldClockUpdates({
      segment: segment(worldId),
      sessionId: 'session-1',
      currentTurn: 1,
      onError,
    });

    expect(note).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(extractionError);
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
    expect(note?.worldClock).toEqual({ turn: 1, open: 1, overdue: 0, opened: ['The council vote'], advanced: [], resolved: [] });
    expect(useWorldThreadStore.getState().getOpenThreadsBySession('session-1')).toHaveLength(1);
  });

  it('with the flag on, a seed that opened nothing carries the seed into the next turn', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    processSpy.mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: { opened: [], advanced: [], resolved: [] },
    });

    await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 1 });

    expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);

    await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 2 });

    expect(processSpy.mock.calls[1][3].seed).toEqual({
      worldDescription: 'The council votes in six weeks.',
      toneInstructions: 'civic drama',
      activeGoals: [],
    });
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
    expect(note?.worldClock).toEqual({ turn: 2, open: 1, overdue: 0, opened: [], advanced: [], resolved: [] });
  });

  it('keeps item-usage segments off the world clock even when the flag is on', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    processSpy.mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
      worldThreads: {
        opened: [{ kind: 'consequence', summary: 'The item attracted attention' }],
        advanced: [],
        resolved: [],
      },
    });

    const note = await applyWorldClockUpdates({
      segment: segment(worldId, {
        type: 'action',
        metadata: { tags: ['item-usage', 'quest-items'] },
      }),
      sessionId: 'session-1',
      currentTurn: 2,
    });

    expect(processSpy).toHaveBeenCalledWith(expect.anything(), 'session-1', undefined, undefined, undefined);
    expect(note).toBeUndefined();
    expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);
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
    expect(noteOne?.worldClock?.opened).toEqual(['The council vote']);
    expect(noteTwo?.worldClock).toEqual({ turn: 2, open: 1, overdue: 0, opened: [], advanced: [], resolved: [] });
  });

  describe('WORLD_COST', () => {
    const clockOnly = (flag: string) => flag === 'WORLD_CLOCK';
    const costOnly = (flag: string) => flag === 'WORLD_COST';

    beforeEach(() => {
      useCharacterStore.setState({ characters: {}, entities: {}, error: null });
      useCharacterStore.setState((state) => ({
        characters: {
          ...state.characters,
          'char-1': {
            id: 'char-1',
            name: 'Jamie Holt',
            description: '',
            worldId,
            level: 1,
            attributes: [],
            skills: [],
            derivedStats: [],
            background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
            isPlayer: true,
            status: { conditions: ['shaken'] },
            inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          } as Character,
        },
      }));
    });

    it('with the flag on, hands the extractor what the character carries and what was lost, then writes the cost home', async () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      processSpy.mockResolvedValue({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldThreads: { opened: [], advanced: [], resolved: [] },
        worldCost: { imposed: [{ kind: 'condition', detail: 'gashed left forearm' }], cleared: ['shaken'] },
      });
      const lostShovel = segment(worldId, {
        metadata: { tags: [], itemsLost: [{ name: 'rusty shovel', lossReason: 'stolen' }] },
      });

      const note = await applyWorldClockUpdates({ segment: lostShovel, sessionId: 'session-1', playerCharacterId: 'char-1', currentTurn: 4 });

      expect(processSpy.mock.calls[0][4]).toEqual({ conditions: ['shaken'], itemsLost: ['rusty shovel'] });
      expect(note?.worldCost).toEqual({
        imposed: [{ kind: 'condition', detail: 'gashed left forearm' }],
        cleared: ['shaken'],
      });
      expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['gashed left forearm']);
    });

    it('keys the cost channel on the player character, not on the first NPC the scene listed', async () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      processSpy.mockResolvedValue({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldThreads: { opened: [], advanced: [], resolved: [] },
        worldCost: { imposed: [{ kind: 'condition', detail: 'discredited before the room' }], cleared: [] },
      });

      // The store hands the goal path metadata.characterIds[0], an NPC id that is not in the character store.
      const note = await applyWorldClockUpdates({
        segment: segment(worldId),
        sessionId: 'session-1',
        characterId: 'npc-henderson',
        playerCharacterId: 'char-1',
        currentTurn: 4,
      });

      expect(processSpy.mock.calls[0][4]).toEqual({ conditions: ['shaken'], itemsLost: [] });
      expect(note?.worldCost?.imposed).toEqual([{ kind: 'condition', detail: 'discredited before the room' }]);
      expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken', 'discredited before the room']);
    });

    it('records a cost against the thread the same extraction resolved', async () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      useWorldThreadStore.getState().applyExtraction(
        'session-1',
        worldId,
        { opened: [{ kind: 'actor', summary: 'The thing in the shed' }], advanced: [], resolved: [] },
        1
      );
      const threadId = useWorldThreadStore.getState().getOpenThreadsBySession('session-1')[0].id;
      processSpy.mockResolvedValue({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldThreads: {
          opened: [],
          advanced: [],
          resolved: [{ id: threadId, outcome: 'resolved', resolution: 'It got through and struck' }],
        },
        worldCost: { imposed: [{ kind: 'condition', detail: 'gashed left forearm', threadId }], cleared: [] },
      });

      const note = await applyWorldClockUpdates({
        segment: segment(worldId),
        sessionId: 'session-1',
        playerCharacterId: 'char-1',
        currentTurn: 4,
      });

      expect(useWorldThreadStore.getState().threads[threadId].costs).toEqual(['gashed left forearm']);
      expect(note?.worldCost?.imposed).toEqual([
        { kind: 'condition', detail: 'gashed left forearm', thread: 'The thing in the shed' },
      ]);
      expect(note?.worldClock?.resolved).toEqual(['The thing in the shed']);
    });

    it('with the flag off, the extractor gets no cost input and nothing is stamped or written', async () => {
      mockIsFeatureEnabled.mockImplementation(clockOnly as typeof isFeatureEnabled);
      processSpy.mockResolvedValue({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldThreads: { opened: [], advanced: [], resolved: [] },
      });

      const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', playerCharacterId: 'char-1', currentTurn: 4 });

      expect(processSpy.mock.calls[0][4]).toBeUndefined();
      expect(note?.worldCost).toBeUndefined();
      expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken']);
    });

    it('works without the clock: the cost channel rides the same call on its own', async () => {
      mockIsFeatureEnabled.mockImplementation(costOnly as typeof isFeatureEnabled);
      processSpy.mockResolvedValue({
        newGoalsCreated: 0,
        goalsUpdated: 0,
        goalsCompleted: 0,
        worldCost: { imposed: [{ kind: 'condition', detail: 'hoarse' }], cleared: [] },
      });

      const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', playerCharacterId: 'char-1', currentTurn: 4 });

      expect(processSpy.mock.calls[0][3]).toBeUndefined();
      expect(processSpy.mock.calls[0][4]).toEqual({ conditions: ['shaken'], itemsLost: [] });
      expect(note).toEqual({ worldCost: { imposed: [{ kind: 'condition', detail: 'hoarse' }], cleared: [] } });
      expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);
    });
  });

  it('leaves the session unseeded when the extraction returned no ledger block', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const note = await applyWorldClockUpdates({ segment: segment(worldId), sessionId: 'session-1', currentTurn: 1 });

    expect(note).toBeUndefined();
    expect(useWorldThreadStore.getState().hasSessionLedger('session-1')).toBe(false);
  });
});
