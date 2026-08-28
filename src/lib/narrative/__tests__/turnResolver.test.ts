import { resolveTurn, resolveInitialTurn } from '../turnResolver';
import { isResolverActive, markResolverActive, markResolverInactive } from '../resolverGuard';
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

const { applyWorldClockUpdates } = jest.requireMock('../applyWorldClockUpdates');
const { applyWorldStateThreadUpdates } = jest.requireMock('../applyWorldStateThreadUpdates');
const { processAcquiredItems } = jest.requireMock('../itemAcquisitionProcessor');
const { processLostItems } = jest.requireMock('../itemLossProcessor');
const { syncNpcMetadata } = jest.requireMock('@/lib/ai/narrativeGenerator.npc');

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

    it('awaits world clock updates instead of fire-and-forget', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(applyWorldClockUpdates).toHaveBeenCalledTimes(1);
      expect(applyWorldClockUpdates).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
        })
      );
    });

    it('awaits world state thread updates instead of fire-and-forget', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(applyWorldStateThreadUpdates).toHaveBeenCalledTimes(1);
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
      expect(result.isEnding).toBe(true);
    });

    it('marks isFatal from a critical failure command', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand({ isFatalCriticalFailure: true });

      const result = await resolveTurn(command, generator);

      expect(result.isFatal).toBe(true);
    });

    it('post-turn snapshot reflects the committed segment', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.snapshot.turnIndex).toBeGreaterThan(0);
      const storedSegments = useNarrativeStore.getState().getSessionSegments('session-1');
      expect(storedSegments.length).toBe(1);
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

  describe('resolver guard', () => {
    it('marks session active during turn resolution', async () => {
      let wasActive = false;
      const generator = {
        generateSegment: jest.fn().mockImplementation(async () => {
          wasActive = isResolverActive('session-1');
          return makeGenerationResult();
        }),
        generateInitialScene: jest.fn(),
      } as unknown as NarrativeGenerator;

      await resolveTurn(makeCommand(), generator);

      expect(wasActive).toBe(true);
      // After resolution, guard should be cleared
      expect(isResolverActive('session-1')).toBe(false);
    });

    it('clears the guard even on error', async () => {
      const generator = {
        generateSegment: jest.fn().mockRejectedValue(new Error('AI failed')),
        generateInitialScene: jest.fn(),
      } as unknown as NarrativeGenerator;

      await expect(resolveTurn(makeCommand(), generator)).rejects.toThrow('AI failed');
      expect(isResolverActive('session-1')).toBe(false);
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
  });
});

describe('resolverGuard', () => {
  afterEach(() => {
    markResolverInactive('test-session');
  });

  it('starts inactive', () => {
    expect(isResolverActive('test-session')).toBe(false);
  });

  it('marks active and inactive', () => {
    markResolverActive('test-session');
    expect(isResolverActive('test-session')).toBe(true);

    markResolverInactive('test-session');
    expect(isResolverActive('test-session')).toBe(false);
  });

  it('scopes to session IDs', () => {
    markResolverActive('session-a');
    expect(isResolverActive('session-a')).toBe(true);
    expect(isResolverActive('session-b')).toBe(false);
    markResolverInactive('session-a');
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
