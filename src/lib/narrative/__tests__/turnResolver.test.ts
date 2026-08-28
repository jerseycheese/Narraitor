import { resolveTurn, resolveInitialTurn } from '../turnResolver';
import { isResolverManaged } from '../resolverGuard';
import { assembleSessionSnapshot } from '../sessionSnapshotAssembler';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import type { NarrativeGenerationResult } from '@/types/narrative.types';
import type { TurnCommand } from '@/types/turnResolver.types';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';

jest.mock('@/lib/featureFlags', () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

jest.mock('../applyWorldClockUpdates', () => ({
  applyWorldClockUpdates: jest.fn().mockResolvedValue(null),
}));

jest.mock('../applyWorldStateThreadUpdates', () => ({
  applyWorldStateThreadUpdates: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../itemAcquisitionProcessor', () => ({
  processAcquiredItems: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../itemLossProcessor', () => ({
  processLostItems: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/ai/narrativeGenerator.npc', () => ({
  syncNpcMetadata: jest.fn(),
}));

jest.mock('../worldClock', () => ({
  countWorldClockTurns: jest.fn((segments: unknown[]) => segments.length),
  buildWorldClockPromptContext: jest.fn(),
}));

jest.mock('../turnsSinceComplication', () => ({
  computeTurnsSinceComplication: jest.fn(() => 0),
}));

jest.mock('../itemLossInference', () => ({
  inferItemsLostFromNarrative: jest.fn(() => []),
}));

jest.mock('@/lib/ai/loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(() => ''),
  checkAndRecordLoreMentions: jest.fn(),
}));

jest.mock('@/lib/analytics/trackFunnelStep', () => ({
  trackFunnelStep: jest.fn(),
}));

jest.mock('@/lib/narrative/narrativeContentGate', () => ({
  applyNarrativeContentGate: jest.fn((content: string) => content),
}));

jest.mock('../turnTags', () => ({
  mergeTurnTags: jest.fn((_prev: string[], current: string[]) => current),
}));

jest.mock('../isSessionEndingSegment', () => ({
  isSessionEndingSegment: jest.fn(() => false),
}));

jest.mock('@/lib/ai/structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn().mockResolvedValue({
    characters: [], locations: [], events: [], rules: [],
  }),
}));

jest.mock('@/lib/ai/narrativeGenerator.continuity', () => ({
  collectContinuityTopicsFromStores: jest.fn(() => []),
}));

const { applyWorldClockUpdates } = jest.requireMock('../applyWorldClockUpdates');
const { applyWorldStateThreadUpdates } = jest.requireMock('../applyWorldStateThreadUpdates');
const { processAcquiredItems } = jest.requireMock('../itemAcquisitionProcessor');
const { processLostItems } = jest.requireMock('../itemLossProcessor');
const { syncNpcMetadata } = jest.requireMock('@/lib/ai/narrativeGenerator.npc');
const { extractStructuredLore } = jest.requireMock('@/lib/ai/structuredLoreExtractor');

function makeGenerationResult(overrides: Partial<NarrativeGenerationResult> = {}): NarrativeGenerationResult {
  return {
    content: 'The road stretches ahead under a gray sky.',
    segmentType: 'scene',
    metadata: {
      characterIds: [],
      tags: [],
      location: 'The road',
      ...overrides.metadata,
    },
    ...overrides,
  };
}

function makeMockGenerator(result?: NarrativeGenerationResult): NarrativeGenerator {
  const genResult = result ?? makeGenerationResult();
  return {
    generateSegment: jest.fn().mockResolvedValue(genResult),
    generateInitialScene: jest.fn().mockResolvedValue(genResult),
  } as unknown as NarrativeGenerator;
}

function makeCommand(overrides: Partial<TurnCommand> = {}): TurnCommand {
  return {
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    choiceId: 'choice-1',
    choiceText: 'Head north',
    isCustomInput: false,
    skillCheckResults: [],
    skillCheckTags: [],
    pacingEscalationRequested: false,
    fatalRiskAllowed: false,
    isFatalCriticalFailure: false,
    ...overrides,
  };
}

function seedStores() {
  useSessionStore.setState({
    id: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    status: 'active',
  } as never);

  useCharacterStore.setState({
    characters: {
      'char-1': {
        id: 'char-1',
        name: 'Test Character',
        description: 'A test character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        level: 1,
        status: { conditions: [] },
        background: '',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    },
  } as never);

  useNarrativeStore.setState({
    segments: {},
    sessionSegments: {},
    decisions: {},
    sessionDecisions: {},
    endedSessions: {},
  } as never);

  useInventoryStore.setState({
    items: {},
    characterInventories: {},
  } as never);

  useWorldThreadStore.setState({
    threads: {},
    sessionThreads: {},
    seedAttempts: {},
  } as never);
}

/** Returns a { promise, resolve, reject } triple for test control. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('TurnResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStores();
  });

  describe('resolveTurn', () => {
    it('commits a segment and returns a settled result', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.segment).toBeDefined();
      expect(result.segment.content).toBe('The road stretches ahead under a gray sky.');
      expect(result.segment.sessionId).toBe('session-1');
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.sessionId).toBe('session-1');
    });

    it('blocks until world clock updates resolve', async () => {
      const clockDeferred = deferred<null>();
      (applyWorldClockUpdates as jest.Mock).mockReturnValue(clockDeferred.promise);

      const generator = makeMockGenerator();
      const command = makeCommand();
      const turnPromise = resolveTurn(command, generator);

      // Flush microtasks so generation and segment commit complete,
      // but reconciliation is still pending.
      await new Promise((r) => setTimeout(r, 0));
      expect(applyWorldClockUpdates).toHaveBeenCalledTimes(1);

      // The resolver should still be pending because the clock update
      // hasn't resolved. If it were void-fired, turnPromise would
      // already have settled.
      let settled = false;
      turnPromise.then(() => { settled = true; });
      await new Promise((r) => setTimeout(r, 0));
      expect(settled).toBe(false);

      // Now resolve the deferred and verify the resolver completes.
      clockDeferred.resolve(null);
      const result = await turnPromise;
      expect(result.segment).toBeDefined();
    });

    it('blocks until world state thread updates resolve', async () => {
      const threadDeferred = deferred<void>();
      (applyWorldStateThreadUpdates as jest.Mock).mockReturnValue(threadDeferred.promise);

      const generator = makeMockGenerator();
      const turnPromise = resolveTurn(makeCommand(), generator);

      await new Promise((r) => setTimeout(r, 0));
      let settled = false;
      turnPromise.then(() => { settled = true; });
      await new Promise((r) => setTimeout(r, 0));
      expect(settled).toBe(false);

      threadDeferred.resolve();
      await turnPromise;
    });

    it('processes acquired items synchronously in the turn pipeline', async () => {
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          itemsAcquired: [{ name: 'Iron sword' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(processAcquiredItems).toHaveBeenCalledWith(
        [{ name: 'Iron sword' }],
        'char-1',
        'session-1'
      );
    });

    it('processes lost items synchronously in the turn pipeline', async () => {
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          itemsLost: [{ name: 'Old key' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(processLostItems).toHaveBeenCalledWith(
        [{ name: 'Old key' }],
        'char-1',
        'session-1'
      );
    });

    it('calls syncNpcMetadata', async () => {
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          characters: [{ id: 'npc-1', name: 'Guard', role: 'guard' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(syncNpcMetadata).toHaveBeenCalledWith(
        'world-1',
        expect.arrayContaining([expect.objectContaining({ name: 'Guard' })])
      );
    });

    it('stamps fatal-outcome tag from world cost reconciliation', async () => {
      (applyWorldClockUpdates as jest.Mock).mockResolvedValueOnce({
        worldCost: { fatal: true, entries: [] },
      });

      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.isFatal).toBe(true);
    });

    it('marks isFatal from a critical failure command without setting isEnding', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand({ isFatalCriticalFailure: true });

      const result = await resolveTurn(command, generator);

      // isFatal is true because the command says so, but isEnding stays
      // false because the segment itself doesn't carry ending tags.
      // The controller decides what to do with isFatal based on its own
      // handler availability.
      expect(result.isFatal).toBe(true);
      expect(result.isEnding).toBe(false);
    });

    it('post-turn snapshot reflects the committed segment', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.snapshot.turnIndex).toBeGreaterThan(0);
      const storedSegments = useNarrativeStore.getState().getSessionSegments('session-1');
      expect(storedSegments.length).toBe(1);
    });

    it('captures reconciliation errors without aborting the turn', async () => {
      (applyWorldClockUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('clock extraction failed')
      );

      const generator = makeMockGenerator();
      const result = await resolveTurn(makeCommand(), generator);

      expect(result.segment).toBeDefined();
      expect(result.reconciliationErrors).toHaveLength(1);
      expect(result.reconciliationErrors[0].step).toBe('worldClock');
    });

    it('fires lore extraction as fire-and-forget', async () => {
      const generator = makeMockGenerator();
      await resolveTurn(makeCommand(), generator);

      expect(extractStructuredLore).toHaveBeenCalledTimes(1);
    });
  });

  describe('turn serialization', () => {
    it('serializes concurrent turns for the same session', async () => {
      const callOrder: string[] = [];

      const slowGenerator = {
        generateSegment: jest.fn().mockImplementation(async () => {
          callOrder.push('gen-start');
          await new Promise((r) => setTimeout(r, 50));
          callOrder.push('gen-end');
          return makeGenerationResult();
        }),
        generateInitialScene: jest.fn(),
      } as unknown as NarrativeGenerator;

      const command1 = makeCommand({ choiceId: 'choice-1' });
      const command2 = makeCommand({ choiceId: 'choice-2' });

      const [result1, result2] = await Promise.all([
        resolveTurn(command1, slowGenerator),
        resolveTurn(command2, slowGenerator),
      ]);

      // Both should succeed
      expect(result1.segment).toBeDefined();
      expect(result2.segment).toBeDefined();

      // The generator should have been called twice sequentially
      expect(slowGenerator.generateSegment).toHaveBeenCalledTimes(2);

      // Verify sequential execution: gen-start, gen-end, gen-start, gen-end
      expect(callOrder).toEqual(['gen-start', 'gen-end', 'gen-start', 'gen-end']);
    });
  });

  describe('resolverManaged guard', () => {
    it('passes resolverManaged to the generator call', async () => {
      const generator = makeMockGenerator();
      await resolveTurn(makeCommand(), generator);

      const genCall = (generator.generateSegment as jest.Mock).mock.calls[0];
      expect(genCall[1]).toEqual(
        expect.objectContaining({ resolverManaged: true })
      );
    });

    it('is call-scoped, not session-scoped', () => {
      // The guard is now a pure function check on the options object.
      // No session-wide state to leak.
      expect(isResolverManaged({ resolverManaged: true })).toBe(true);
      expect(isResolverManaged({ resolverManaged: false })).toBe(false);
      expect(isResolverManaged(undefined)).toBe(false);
      expect(isResolverManaged({})).toBe(false);
    });
  });

  describe('abort handling', () => {
    it('propagates abort signal to the generator', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const generator = {
        generateSegment: jest.fn().mockRejectedValue(new Error('aborted')),
        generateInitialScene: jest.fn(),
      } as unknown as NarrativeGenerator;

      const command = makeCommand({ signal: abortController.signal });

      await expect(resolveTurn(command, generator)).rejects.toThrow();

      // No segment should be committed
      const segments = useNarrativeStore.getState().getSessionSegments('session-1');
      expect(segments.length).toBe(0);
    });
  });

  describe('resolveInitialTurn', () => {
    it('commits the first segment and returns a settled result', async () => {
      const generator = makeMockGenerator();

      const result = await resolveInitialTurn(
        {
          sessionId: 'session-1',
          worldId: 'world-1',
          characterId: 'char-1',
          generateChoices: true,
        },
        generator
      );

      expect(result.segment).toBeDefined();
      expect(result.segment.content).toBe('The road stretches ahead under a gray sky.');
      expect(generator.generateInitialScene).toHaveBeenCalledTimes(1);
      expect(applyWorldClockUpdates).toHaveBeenCalledTimes(1);
    });

    it('skips generation when a segment already exists in the store', async () => {
      // Simulate another instance having committed a segment
      useNarrativeStore.getState().addSegment('session-1', {
        content: 'Previously committed.',
        type: 'scene',
        characterIds: [],
        metadata: { characterIds: [], tags: [] },
        worldId: 'world-1',
        timestamp: new Date(),
        updatedAt: new Date().toISOString(),
      });

      const generator = makeMockGenerator();
      const result = await resolveInitialTurn(
        {
          sessionId: 'session-1',
          worldId: 'world-1',
          characterId: 'char-1',
          generateChoices: true,
        },
        generator
      );

      // Should adopt the existing segment, not generate a new one
      expect(generator.generateInitialScene).not.toHaveBeenCalled();
      expect(result.segment.content).toBe('Previously committed.');
    });

    it('returns reconciliation errors when present', async () => {
      (applyWorldStateThreadUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('thread extraction failed')
      );

      const generator = makeMockGenerator();
      const result = await resolveInitialTurn(
        {
          sessionId: 'session-1',
          worldId: 'world-1',
          characterId: 'char-1',
          generateChoices: true,
        },
        generator
      );

      expect(result.reconciliationErrors).toHaveLength(1);
      expect(result.reconciliationErrors[0].step).toBe('worldStateThreads');
    });
  });
});

describe('resolverManaged guard', () => {
  it('returns true only when explicitly set', () => {
    expect(isResolverManaged({ resolverManaged: true })).toBe(true);
  });

  it('returns false for all other inputs', () => {
    expect(isResolverManaged(undefined)).toBe(false);
    expect(isResolverManaged({})).toBe(false);
    expect(isResolverManaged({ resolverManaged: false })).toBe(false);
  });
});

describe('sessionSnapshotAssembler', () => {
  beforeEach(() => {
    seedStores();
  });

  it('assembles a frozen snapshot from current store state', () => {
    const snapshot = assembleSessionSnapshot('session-1');

    expect(snapshot.sessionId).toBe('session-1');
    expect(snapshot.worldId).toBe('world-1');
    expect(snapshot.characterId).toBe('char-1');
    expect(Object.isFrozen(snapshot.segments)).toBe(true);
    expect(Object.isFrozen(snapshot.decisions)).toBe(true);
    expect(Object.isFrozen(snapshot.inventory)).toBe(true);
  });

  it('uses authoritative IDs from the command, not the session singleton', () => {
    // Point the session singleton at a different world/character
    useSessionStore.setState({
      id: 'session-1',
      worldId: 'other-world',
      characterId: 'other-char',
      status: 'active',
    } as never);

    const snapshot = assembleSessionSnapshot('session-1', {
      worldId: 'world-1',
      characterId: 'char-1',
    });

    expect(snapshot.worldId).toBe('world-1');
    expect(snapshot.characterId).toBe('char-1');
  });

  it('falls back to session singleton when IDs are not passed', () => {
    const snapshot = assembleSessionSnapshot('session-1');

    expect(snapshot.worldId).toBe('world-1');
    expect(snapshot.characterId).toBe('char-1');
  });

  it('reads character conditions', () => {
    useCharacterStore.setState({
      characters: {
        'char-1': {
          id: 'char-1',
          name: 'Test',
          description: '',
          worldId: 'world-1',
          attributes: [],
          skills: [],
          level: 1,
          status: { conditions: ['poisoned', 'exhausted'] },
          background: '',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    } as never);

    const snapshot = assembleSessionSnapshot('session-1');
    expect(snapshot.conditions).toEqual(['poisoned', 'exhausted']);
  });
});
