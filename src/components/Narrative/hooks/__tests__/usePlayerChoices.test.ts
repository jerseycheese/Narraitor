import { renderHook, act } from '@testing-library/react';
import { usePlayerChoices } from '../usePlayerChoices';
import { useNarrativeStore } from '@/state/narrativeStore';
import { createMockNarrativeStore, mockZustandStore } from '@/lib/test-utils';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';

jest.mock('@/state/narrativeStore', () => ({ useNarrativeStore: jest.fn() }));

const baseSegment = {
  id: 'seg-1',
  sessionId: 's1',
  worldId: 'w1',
  content: 'The hero pauses.',
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date('2025-01-01T00:00:00Z'),
};

const aiDecision = {
  id: 'ai-d',
  prompt: 'What do you do?',
  options: [{ id: 'o1', text: 'Press on', alignment: 'neutral' }],
  decisionWeight: 'major',
  contextSummary: 'A fork in the road.',
};

function setupStore(overrides: Record<string, unknown> = {}) {
  // A tiny fake store slice, not just a call-recorder: addDecision writes into
  // storedDecisions and getSessionDecisions reads it back, so a test can prove
  // a decision is readable after storing it rather than only that addDecision
  // was invoked with the right arguments.
  const storedDecisions: Array<Record<string, unknown>> = [];
  const addDecision = jest.fn((sessionId: string, decisionData: Record<string, unknown>) => {
    const id = 'stored-decision-1';
    storedDecisions.push({ id, sessionId, ...decisionData });
    return id;
  });
  const getSessionSegments = jest.fn().mockReturnValue([baseSegment]);
  const getSessionDecisions = jest.fn(() => storedDecisions);
  mockZustandStore(
    useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
    createMockNarrativeStore({
      addDecision,
      getSessionSegments,
      getSessionDecisions,
      ...overrides,
    })
  );
  return { addDecision, getSessionSegments, getSessionDecisions };
}

function renderPlayerChoices() {
  const aiGenerate = jest.fn().mockResolvedValue(aiDecision);
  const onChoicesGenerated = jest.fn();
  const onError = jest.fn();
  const warnMissingSessionId = jest.fn();
  const mountedRef = { current: true };
  const narrativeGenerator = {
    generatePlayerChoices: aiGenerate,
  } as unknown as NarrativeGenerator;

  const utils = renderHook(() =>
    usePlayerChoices({
      sessionId: 's1',
      worldId: 'w1',
      characterId: 'c1',
      narrativeGenerator,
      warnMissingSessionId,
      mountedRef,
      onChoicesGenerated,
      onError,
    })
  );

  return { ...utils, aiGenerate, onChoicesGenerated, onError, mountedRef };
}

describe('usePlayerChoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // structuredClone is undefined in the jest/jsdom env; the hook uses it to
    // deep-copy the decision before notifying. Polyfill so we exercise the real
    // (browser) notify path rather than the silently-caught failure branch.
    if (typeof globalThis.structuredClone !== 'function') {
      globalThis.structuredClone = ((val: unknown) =>
        JSON.parse(JSON.stringify(val))) as typeof structuredClone;
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('generates AI choices, persists the decision, and notifies the parent', async () => {
    const { getSessionDecisions } = setupStore();
    const { result, aiGenerate, onChoicesGenerated } = renderPlayerChoices();

    await act(async () => {
      await result.current.generatePlayerChoices();
    });

    expect(aiGenerate).toHaveBeenCalledWith(
      'w1',
      expect.any(Object),
      ['c1'],
      's1',
      expect.any(Object)
    );

    // Read the decision back through the same getter the store exposes,
    // rather than inspecting addDecision's call args, so this proves the
    // decision is actually stored and retrievable.
    const [stored] = getSessionDecisions();
    expect(stored).toMatchObject({
      sessionId: 's1',
      prompt: 'What do you do?',
      decisionWeight: 'major',
      contextSummary: 'A fork in the road.',
    });
    expect(onChoicesGenerated).toHaveBeenCalledTimes(1);
  });

  it('accepts an explicit SessionSnapshot and passes it directly to the generator', async () => {
    setupStore();
    const { result, aiGenerate, onChoicesGenerated } = renderPlayerChoices();

    const explicitSnapshot = {
      sessionId: 's1',
      worldId: 'w1',
      characterId: 'c1',
      turnIndex: 1,
      segments: [baseSegment],
      decisions: [],
      character: { id: 'c1', name: 'Custom Character', worldId: 'w1', level: 1 },
      inventory: [{ id: 'item-custom', name: 'Custom Wand', characterId: 'c1', quantity: 1, equipped: true }],
      worldThreads: [],
      worldState: undefined,
      loreContext: 'Custom lore fact',
      npcs: [{ id: 'npc-custom', name: 'Elder Sage', worldId: 'w1' }],
      conditions: [],
      endedSessions: {},
    };

    await act(async () => {
      await result.current.generatePlayerChoices(explicitSnapshot as unknown as import('@/types/turnResolver.types').SessionSnapshot);
    });

    expect(aiGenerate).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({
        sessionId: 's1',
        worldId: 'w1',
        recentSegments: [baseSegment],
      }),
      ['c1'],
      's1',
      explicitSnapshot
    );
    expect(onChoicesGenerated).toHaveBeenCalledTimes(1);
  });

  it('guards against overlapping generation (second call is a no-op)', async () => {
    setupStore();
    const { result, aiGenerate } = renderPlayerChoices();

    await act(async () => {
      const gen = result.current.generatePlayerChoices;
      const first = gen();
      const second = gen();
      await Promise.all([first, second]);
    });

    expect(aiGenerate).toHaveBeenCalledTimes(1);
  });

  it('returns early without an AI call when the session has no segments', async () => {
    const { addDecision } = setupStore({
      getSessionSegments: jest.fn().mockReturnValue([]),
    });
    const { result, aiGenerate } = renderPlayerChoices();

    await act(async () => {
      await result.current.generatePlayerChoices();
    });

    expect(aiGenerate).not.toHaveBeenCalled();
    expect(addDecision).not.toHaveBeenCalled();
  });
});
