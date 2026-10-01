import {
  resolveTurn,
  resolveInitialTurn,
  resolveItemUseTurn,
} from '../turnResolver';
import { isResolverManaged } from '../resolverGuard';
import { assembleSessionSnapshot } from '../sessionSnapshotAssembler';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useSceneStore } from '@/state/sceneStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { sceneTemplate } from '@/lib/promptTemplates/templates/narrative/sceneTemplate';
import { actionTemplate } from '@/lib/promptTemplates/templates/narrative/actionTemplate';
import { FIRST_SEGMENT_LOCATION } from '@/types/narrative.types';
import { PARTIAL_RECONCILIATION_ERROR } from '@/lib/narrative/narrativeErrors';
import type {
  NarrativeGenerationResult,
  NarrativeSegment,
} from '@/types/narrative.types';
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
  isWorldClockTurnSegment: jest.fn(
    (segment: { metadata?: { tags?: string[] } }) =>
      !segment.metadata?.tags?.includes('item-usage')
  ),
  buildWorldClockPromptContext: jest.fn(),
  needsSceneTransition: jest.fn(() => false),
}));

jest.mock('../turnsSinceComplication', () => ({
  computeTurnsSinceComplication: jest.fn(() => 0),
  isPacingStale: jest.fn(() => false),
}));

jest.mock('../itemLossInference', () => ({
  inferItemsLostFromNarrative: jest.fn(() => []),
}));

jest.mock('@/lib/inventory/checkItemSimilarityClient', () => ({
  checkItemSimilarityClient: jest.fn().mockResolvedValue({
    similar: false,
    confidence: 0,
  }),
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
  WORLD_CLOCK_TRANSITION_TAG: 'world-clock-transition',
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
const { inferItemsLostFromNarrative } = jest.requireMock('../itemLossInference');
const { inferItemsLostFromNarrative: inferItemsLostFromNarrativeActual } =
  jest.requireActual('../itemLossInference');
const { syncNpcMetadata } = jest.requireMock('@/lib/ai/narrativeGenerator.npc');
const { extractStructuredLore } = jest.requireMock('@/lib/ai/structuredLoreExtractor');
const { checkAndRecordLoreMentions } = jest.requireMock('@/lib/ai/loreContextHelper');
const { buildWorldClockPromptContext, needsSceneTransition } = jest.requireMock('../worldClock');

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

function seedItemUseStores(quantity = 2) {
  useWorldStore.getState().reset();
  useCharacterStore.getState().reset();
  useInventoryStore.getState().reset();
  useNarrativeStore.getState().reset();

  const worldId = useWorldStore.getState().create({
    name: 'Test World',
    description: 'A world for resolver tests',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 10,
      skillPointPool: 10,
    },
  });
  const characterId = useCharacterStore.getState().create({
    name: 'Test Character',
    worldId,
    description: 'A test character',
    level: 1,
    isPlayer: true,
    status: { conditions: [] },
    inventory: {
      characterId: '',
      items: [],
      capacity: 0,
      categories: [],
      itemOrder: [],
    },
    background: {
      history: 'A test history',
      personality: 'Careful',
      goals: [],
      fears: [],
      relationships: [],
    },
    attributes: [],
    skills: [],
    derivedStats: [],
  });
  const sessionId = `session-${worldId}-${characterId}`;
  useSessionStore.setState({
    id: sessionId,
    worldId,
    characterId,
    status: 'active',
  } as never);
  const itemId = useInventoryStore.getState().addItem(characterId, {
    name: 'Healing Potion',
    description: 'Restores vitality',
    stackable: true,
    quantity,
    categorization: {
      categoryId: 'consumables',
      source: 'manual',
      classifiedAt: new Date().toISOString(),
    },
    acquisition: {
      method: 'loot',
      acquiredAt: new Date().toISOString(),
      quantity,
    },
  });

  return { sessionId, worldId, characterId, itemId };
}

function makeItemUseGenerator(
  result: NarrativeGenerationResult = makeGenerationResult({
    content: 'You drink the potion and warmth returns to your limbs.',
    segmentType: 'action',
    metadata: { characterIds: [], tags: ['item-usage'] },
  })
): NarrativeGenerator {
  return {
    generateSegment: jest.fn().mockResolvedValue(result),
    generatePlayerChoices: jest.fn().mockResolvedValue({
      prompt: 'What do you do next?',
      options: [{ id: 'option-1', text: 'Continue onward' }],
      decisionWeight: 'minor',
      contextSummary: 'After using the potion',
    }),
  } as unknown as NarrativeGenerator;
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
    describe('scene stall breaker', () => {
      const quietTurnLimit = 5;

      beforeEach(() => {
        useSceneStore.setState({ scenes: {} });
        const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
        (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
        (needsSceneTransition as jest.Mock).mockReturnValue(false);
      });

      it('forces a cut after five quiet turns without a due clock thread', async () => {
        const generator = makeMockGenerator();
        for (let turn = 0; turn < quietTurnLimit; turn += 1) {
          await resolveTurn(makeCommand(), generator);
          expect((generator.generateSegment as jest.Mock).mock.calls[turn][0].generationParameters)
            .not.toHaveProperty('segmentType');
        }
        (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
          segmentType: 'transition',
          metadata: { characterIds: [], tags: [], sceneTransition: { to: 'The road' } },
        }));
        await resolveTurn(makeCommand(), generator);
        const request = (generator.generateSegment as jest.Mock).mock.calls[quietTurnLimit][0];
        expect(request.generationParameters.segmentType).toBe('transition');
        const prompt = sceneTemplate({ narrativeContext: request.narrativeContext, generationParameters: request.generationParameters });
        expect(prompt).toContain('FORCED SCENE EXIT OR TIME SKIP');
        expect(prompt).toContain('5 quiet turns');
        expect(prompt).toContain('metadata.sceneTransition');
        expect(prompt).not.toContain('"sceneTransition":');
        (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult());
        await resolveTurn(makeCommand(), generator);
        expect((generator.generateSegment as jest.Mock).mock.calls[quietTurnLimit + 1][0].generationParameters)
          .not.toHaveProperty('segmentType');
      });

      it.each(['transition', 'beat'])(
        'resets the quiet count on a recorded %s', async (progress) => {
          const generator = makeMockGenerator();
          for (let turn = 0; turn < quietTurnLimit - 1; turn += 1) {
            await resolveTurn(makeCommand(), generator);
          }
          (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
            metadata: { characterIds: [], tags: [], ...(progress === 'transition'
              ? { sceneTransition: { to: 'Old Mill' } }
              : { sceneBeat: { id: 'reveal', text: 'The guard revealed the culprit.' } }) },
          }));
          await resolveTurn(makeCommand(), generator);
          (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult());
          for (let turn = 0; turn < quietTurnLimit; turn += 1) {
            await resolveTurn(makeCommand(), generator);
            const request = (generator.generateSegment as jest.Mock).mock.calls[quietTurnLimit + turn][0];
            expect(request.generationParameters).not.toHaveProperty('segmentType');
          }
          (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
            metadata: { characterIds: [], tags: [], sceneTransition: { to: 'The road' } },
          }));
          await resolveTurn(makeCommand(), generator);
          expect((generator.generateSegment as jest.Mock).mock.lastCall[0].generationParameters.segmentType)
            .toBe('transition');
        }
      );

      it.each([undefined, FIRST_SEGMENT_LOCATION])(
        'retries a forced cut without a usable transition target (%s)', async (target) => {
          const generator = makeMockGenerator();
          for (let turn = 0; turn < quietTurnLimit; turn += 1) await resolveTurn(makeCommand(), generator);
          (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
            metadata: { characterIds: [], tags: [], ...(target ? { sceneTransition: { to: target } } : {}) },
          }));
          (generator.generateSegment as jest.Mock).mockResolvedValueOnce(makeGenerationResult({
            metadata: { characterIds: [], tags: [], ...(target ? { sceneTransition: { to: target } } : {}) },
          })).mockResolvedValueOnce(makeGenerationResult({
            metadata: { characterIds: [], tags: [], sceneTransition: { to: 'Old Mill' } },
          }));
          const result = await resolveTurn(makeCommand(), generator);
          expect(result.status).toBe('settled');
          expect(result.segment.metadata.sceneTransition).toEqual({ to: 'Old Mill' });
          expect(useNarrativeStore.getState().getSessionSegments('session-1')).toHaveLength(quietTurnLimit + 1);
          const retry = (generator.generateSegment as jest.Mock).mock.lastCall[0];
          expect(sceneTemplate({ narrativeContext: retry.narrativeContext })).toContain('RETRY:');
        }
      );


      it('commits a recorded time skip and resets the counter when the model ignores the stall instruction twice', async () => {
        const generator = makeMockGenerator();
        for (let turn = 0; turn < quietTurnLimit; turn += 1) await resolveTurn(makeCommand(), generator);
        const { logger } = jest.requireActual('@/lib/utils/logger');
        const warning = jest.spyOn(logger, 'warn').mockImplementation(() => {});
        try {
          const result = await resolveTurn(makeCommand(), generator);
          expect(generator.generateSegment).toHaveBeenCalledTimes(quietTurnLimit + 2);
          expect(result.status).toBe('settled');
          expect(result.segment.content).toBe(makeGenerationResult().content);
          expect(result.segment.metadata.sceneTransition).toEqual({ to: 'The road' });
          expect(useNarrativeStore.getState().getSessionSegments('session-1')).toHaveLength(quietTurnLimit + 1);
          expect(warning).toHaveBeenCalledWith(expect.stringContaining('Forced scene time skip'), expect.objectContaining({ sessionId: 'session-1' }));
          await resolveTurn(makeCommand(), generator);
          const request = (generator.generateSegment as jest.Mock).mock.lastCall[0];
          expect(request.generationParameters).not.toHaveProperty('segmentType');
          expect(request.narrativeContext).not.toHaveProperty('stalledSceneTurns');
        } finally {
          warning.mockRestore();
        }
      });

      it('recovers a stalled legacy session without treating a placeholder as progress', async () => {
        const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
        (isFeatureEnabled as jest.Mock).mockReturnValue(false);
        const generator = makeMockGenerator(makeGenerationResult({
          metadata: { characterIds: [], tags: [], location: FIRST_SEGMENT_LOCATION, sceneTransition: { to: FIRST_SEGMENT_LOCATION } },
        }));
        for (let turn = 0; turn < quietTurnLimit; turn += 1) await resolveTurn(makeCommand(), generator);
        expect(useSceneStore.getState().scenes).toEqual({});
        (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
        (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
          metadata: { characterIds: [], tags: [], sceneTransition: { to: 'Old Mill' } },
        }));
        await resolveTurn(makeCommand(), generator);
        const request = (generator.generateSegment as jest.Mock).mock.lastCall[0];
        expect(request.generationParameters.segmentType).toBe('transition');
        expect(request.narrativeContext.sceneState.location).toBeNull();
        expect(useSceneStore.getState().scenes['session-1'].location).toBe('Old Mill');
      });

      it('keeps clock-driven prompts identical to develop when the scene flag is off', async () => {
        const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
        (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'WORLD_CLOCK');
        (needsSceneTransition as jest.Mock).mockReturnValue(true);
        const generator = makeMockGenerator();
        await resolveTurn(makeCommand(), generator);
        const request = (generator.generateSegment as jest.Mock).mock.lastCall[0];
        expect(request.generationParameters.segmentType).toBe('transition');
        const context = { narrativeContext: request.narrativeContext, generationParameters: request.generationParameters };
        expect(sceneTemplate({ ...context, narrativeContext: { ...context.narrativeContext, stalledSceneTurns: 20, isStallRetry: true } }))
          .toBe(sceneTemplate(context));
      });

      it('preserves a due clock transition with scene state enabled before the stall threshold', async () => {
        (needsSceneTransition as jest.Mock).mockReturnValue(true);
        const generator = makeMockGenerator();
        await resolveTurn(makeCommand(), generator);
        const request = (generator.generateSegment as jest.Mock).mock.lastCall[0];
        expect(request.generationParameters.segmentType).toBe('transition');
        expect(sceneTemplate({ narrativeContext: request.narrativeContext, generationParameters: request.generationParameters }))
          .not.toContain('FORCED SCENE EXIT OR TIME SKIP');
      });
    });

    it('records a structured beat and carries it into the next prompt', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const beat = { id: 'bus-arrival', text: 'The bus arrived at the cabin.' };
      const generator = makeMockGenerator(makeGenerationResult({
        metadata: { characterIds: [], tags: [], sceneBeat: beat },
      }));
      const command = makeCommand({ sessionId, worldId, characterId });
      const result = await resolveTurn(command, generator);
      expect(result.snapshot.sceneState?.completedBeats).toEqual([{ ...beat, turnIndex: 1 }]);
      (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult());
      const next = await resolveTurn(command, generator);
      expect(next.snapshot.sceneState?.completedBeats).toEqual([{ ...beat, turnIndex: 1 }]);
      const { narrativeContext } = (generator.generateSegment as jest.Mock).mock.calls[1][0];
      const prompt = sceneTemplate({ narrativeContext });
      expect(prompt).toContain('SETTLED SCENE BEATS');
      expect(prompt).toContain('bus-arrival');
      expect(prompt).toContain(beat.text);
      expect(prompt).not.toContain('"sceneBeat":');
    });

    it('commits a segment with a duplicate beat id without recording the beat twice', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const originalBeat = { id: 'bus-arrival', text: 'The bus arrived.', turnIndex: 1 };
      useSceneStore.getState().recordBeat(sessionId, originalBeat);
      const generator = makeMockGenerator(makeGenerationResult({
        content: 'The bus passengers inspect the cabin.',
        metadata: { characterIds: [], tags: [], sceneBeat: { id: 'bus-arrival', text: 'A bus arrives.' } },
      }));
      const { logger } = jest.requireActual('@/lib/utils/logger');
      const warning = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      try {
        const result = await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);
        expect(result.status).toBe('settled');
        expect(result.segment.content).toBe('The bus passengers inspect the cabin.');
        expect(result.segment.metadata).not.toHaveProperty('sceneBeat');
        expect(useNarrativeStore.getState().getSessionSegments(sessionId)).toHaveLength(1);
        expect(result.snapshot.sceneState?.completedBeats).toEqual([originalBeat]);
        expect(warning).toHaveBeenCalledWith(expect.stringContaining('Dropped duplicate scene beat'), expect.objectContaining({ sessionId, beatId: 'bus-arrival' }));
      } finally {
        warning.mockRestore();
      }
    });

    it('keeps prompts identical and ignores beat recording with SCENE_STATE off', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      const generator = makeMockGenerator(makeGenerationResult({
        metadata: { characterIds: [], tags: [], sceneBeat: { id: 'arrival', text: 'The bus arrived.' } },
      }));
      await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);
      const { narrativeContext } = (generator.generateSegment as jest.Mock).mock.calls[0][0];
      const baseline = sceneTemplate({ narrativeContext });
      expect(sceneTemplate({ narrativeContext: {
        ...narrativeContext,
        sceneState: { location: 'Cabin', presentNpcNames: [], completedBeats: [{ id: 'arrival', text: 'The bus arrived.', turnIndex: 1 }] },
      } })).toBe(baseline);
      expect(useSceneStore.getState().scenes).toEqual({});
    });

    it('keeps sceneTransition in instructions and out of the stationary response example', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().setLocation(sessionId, 'Muddy Lake');
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator();

      await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);

      const { narrativeContext } = (generator.generateSegment as jest.Mock).mock.calls[0][0];
      const prompt = sceneTemplate({ worldName: 'Test World', genre: 'fantasy', tone: 'tense', narrativeContext });
      expect(prompt).toContain('report metadata.sceneTransition');
      expect(prompt).not.toContain('"sceneTransition":');
    });

    it('restores legacy on-screen NPCs when no scene record exists', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useNPCStore.getState().createNPC({
        id: 'npc-guard', name: 'Guard', description: 'A guard', worldId,
      });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      useNarrativeStore.getState().addSegment(sessionId, {
        content: 'Guard stands beside you at the lake.',
        type: 'scene',
        characterIds: [characterId, 'npc-guard'],
        metadata: { characterIds: [characterId, 'npc-guard'], tags: [], location: 'Muddy Lake' },
        worldId,
        timestamp: new Date(),
        updatedAt: new Date().toISOString(),
      });
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator(makeGenerationResult({
        content: 'You inspect the shoreline.',
        metadata: { characterIds: [], tags: [], location: 'Muddy Lake' },
      }));

      const result = await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);

      expect((generator.generateSegment as jest.Mock).mock.calls[0][0].narrativeContext.sceneState)
        .toEqual({ location: 'Muddy Lake', presentNpcNames: ['Guard'], completedBeats: [] });
      expect(result.snapshot.sceneState?.presentNpcIds).toEqual(['npc-guard']);
    });

    it('keeps the recorded place when a model location label drifts', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().setLocation(sessionId, 'Muddy Lake');
      useSceneStore.getState().setPresentNpcIds(sessionId, ['npc-guard']);
      useNPCStore.getState().createNPC({
        id: 'npc-guard', name: 'Guard', description: 'A guard', worldId,
      });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator(makeGenerationResult({
        content: 'The water laps at the shore.',
        metadata: { characterIds: [], tags: [], location: "Muddy Lake's" },
      }));
      const result = await resolveTurn(
        makeCommand({ sessionId, worldId, characterId }),
        generator
      );

      expect(result.segment.metadata.location).toBe('Muddy Lake');
      expect(result.snapshot.sceneState?.location).toBe('Muddy Lake');
      expect(result.snapshot.sceneState?.presentNpcIds).toContain('npc-guard');
      const promptContext = (generator.generateSegment as jest.Mock).mock.calls[0][0].narrativeContext;
      expect(promptContext.currentSituation).toBe('Player chose: "Head north"');
      expect(promptContext.sceneState).toEqual({ location: 'Muddy Lake', presentNpcNames: ['Guard'], completedBeats: [] });
    });

    it('moves the recorded place only for a structured transition', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().setLocation(sessionId, 'Muddy Lake');
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator(makeGenerationResult({
        content: 'You step into the mill.',
        metadata: {
          characterIds: [], tags: [], location: 'A damp building',
          sceneTransition: { to: 'Old Mill' },
        },
      }));

      const result = await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);
      expect(result.segment.metadata.location).toBe('Old Mill');
      expect(result.snapshot.sceneState?.location).toBe('Old Mill');
    });

    it('uses the transition target when the stored location label conflicts', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().setLocation(sessionId, 'Muddy Lake');
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator(makeGenerationResult({
        metadata: {
          characterIds: [], tags: [], location: "the kitchen's",
          sceneTransition: { to: 'Council room' },
        },
      }));
      const addSegment = useNarrativeStore.getState().addSegment;
      const addSegmentSpy = jest.spyOn(useNarrativeStore.getState(), 'addSegment').mockImplementation(
        (...args) => {
          const id = addSegment(...args);
          const segment = useNarrativeStore.getState().segments[id];
          useNarrativeStore.setState((state) => ({
            segments: {
              ...state.segments,
              [id]: { ...segment, metadata: { ...segment.metadata, location: "the kitchen's" } },
            },
          }));
          return id;
        }
      );
      try {
        const result = await resolveTurn(makeCommand({ sessionId, worldId, characterId }), generator);
        expect(result.snapshot.sceneState?.location).toBe('Council room');
      } finally {
        addSegmentSpy.mockRestore();
        useNarrativeStore.setState({ addSegment });
      }
    });

    it('keeps the existing location label behavior with SCENE_STATE off', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().setLocation(sessionId, 'Muddy Lake');
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      const generator = makeMockGenerator(makeGenerationResult({
        metadata: { characterIds: [], tags: [], location: "Muddy Lake's", sceneTransition: { to: 'Old Mill' } },
      }));
      const result = await resolveTurn(
        makeCommand({ sessionId, worldId, characterId }),
        generator
      );

      expect(result.segment.metadata.location).toBe("Muddy Lake's");
      expect(result.segment.metadata.sceneTransition).toBeUndefined();
      expect(result.snapshot.sceneState).toBeUndefined();
      expect(useSceneStore.getState().scenes[sessionId]?.location).toBe('Muddy Lake');
      expect((generator.generateSegment as jest.Mock).mock.calls[0][0].narrativeContext.currentSituation).toBe('Player chose: "Head north"');
    });

    it('keeps an NPC present when prose says they leave an object', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const npcId = 'npc-guard';
      const generator = makeMockGenerator();
      (generator.generateSegment as jest.Mock)
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard joins you at the gate.',
          metadata: { characterIds: [npcId], characters: [{ id: npcId, name: 'Guard', description: 'A guard' }], tags: [] },
        }))
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard leaves the key on the table.',
          metadata: { characterIds: [npcId], sceneExits: ['npc-unknown'], characters: [{ id: npcId, name: 'Guard', description: 'A guard' }], tags: [] },
        }));

      const command = makeCommand({ sessionId, worldId, characterId });
      await resolveTurn(command, generator);
      await resolveTurn(command, generator);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).toContain(npcId);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).not.toContain('npc-unknown');
    });

    it('keeps a departed NPC absent until an explicit return, including the relationship gate', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const npcId = 'npc-guard';
      const generator = makeMockGenerator();
      (generator.generateSegment as jest.Mock)
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard joins you at the gate.',
          metadata: { characterIds: [npcId], characters: [{ id: npcId, name: 'Guard', description: 'A guard' }], tags: [] },
        }))
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard leaves the courtyard.',
          metadata: { characterIds: [], sceneExits: [npcId], tags: [] },
        }))
        .mockResolvedValueOnce(makeGenerationResult({ content: 'You wait alone.' }))
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard calls out and acts from beyond the gate.',
          metadata: { characterIds: [npcId], characters: [{ id: npcId, name: 'Guard', description: 'A guard' }], tags: [] },
        }))
        .mockResolvedValueOnce(makeGenerationResult({
          content: 'Guard returns to the courtyard.',
          metadata: { characterIds: [npcId], sceneEntries: [npcId], characters: [{ id: npcId, name: 'Guard', description: 'A guard' }], tags: [] },
        }));
      const command = makeCommand({ sessionId, worldId, characterId });
      await resolveTurn(command, generator);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).toContain(npcId);
      await resolveTurn(command, generator);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).not.toContain(npcId);
      await resolveTurn(command, generator);
      await resolveTurn(command, generator);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).not.toContain(npcId);

      const selectRelationshipChoice = async (optionId: string) => {
        const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
          prompt: 'What do you do?',
          options: [{ id: optionId, text: 'Help Guard', alignment: 'neutral', consequences: [
            { type: 'relationship', action: 'add', targetId: npcId, value: 10 },
          ] }],
        });
        await useNarrativeStore.getState().selectDecisionOption(decisionId, optionId, characterId);
      };
      await selectRelationshipChoice('choice-absent');
      expect(useWorldStore.getState().getWorldState(worldId).npcRelationships[npcId]).toBeUndefined();

      await resolveTurn(command, generator);
      expect(useSceneStore.getState().scenes[sessionId]?.presentNpcIds).toContain(npcId);
      await selectRelationshipChoice('choice-returned');
      expect(useWorldStore.getState().getWorldState(worldId).npcRelationships[npcId].trust).toBe(60);
    });

    it('waits for scene hydration before assembling the first prompt snapshot', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const hydration = deferred<void>();
      const hydratedSpy = jest.spyOn(useSceneStore.persist, 'hasHydrated').mockReturnValue(false);
      const rehydrateSpy = jest.spyOn(useSceneStore.persist, 'rehydrate').mockImplementation(async () => {
        await hydration.promise;
        useSceneStore.setState({ scenes: {
          'session-1': { location: null, presentNpcIds: ['npc-guard'], completedBeats: [] },
        } });
      });
      try {
        const generator = makeMockGenerator();
        const turn = resolveTurn(makeCommand(), generator);
        await Promise.resolve();
        expect(generator.generateSegment).not.toHaveBeenCalled();
        hydration.resolve();
        const result = await turn;
        expect(result.status).toBe('settled');
        expect(rehydrateSpy).toHaveBeenCalledTimes(1);
        expect(result.snapshot.sceneState?.presentNpcIds).toContain('npc-guard');
      } finally {
        hydratedSpy.mockRestore();
        rehydrateSpy.mockRestore();
      }
    });

    it('waits for scene hydration before applying a relationship choice', async () => {
      const { sessionId, worldId, characterId } = seedItemUseStores();
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const npcId = 'npc-guard';
      await resolveTurn(makeCommand({ sessionId, worldId, characterId }), makeMockGenerator());
      useSceneStore.setState({ scenes: {} });
      const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
        prompt: 'Help the guard?',
        options: [{ id: 'help', text: 'Help', alignment: 'neutral', consequences: [
          { type: 'relationship', action: 'add', targetId: npcId, value: 10 },
        ] }],
      });
      const hydration = deferred<void>();
      const hydratedSpy = jest.spyOn(useSceneStore.persist, 'hasHydrated')
        .mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValue(true);
      const rehydrateSpy = jest.spyOn(useSceneStore.persist, 'rehydrate').mockImplementation(async () => {
        await hydration.promise;
        useSceneStore.getState().setPresentNpcIds(sessionId, [npcId]);
      });
      try {
        const selection = useNarrativeStore.getState().selectDecisionOption(decisionId, 'help', characterId);
        expect(useWorldStore.getState().getWorldState(worldId).npcRelationships[npcId]).toBeUndefined();
        hydration.resolve();
        await selection;
        expect(rehydrateSpy).toHaveBeenCalledTimes(1);
        expect(useWorldStore.getState().getWorldState(worldId).npcRelationships[npcId].trust).toBe(60);
      } finally {
        hydratedSpy.mockRestore();
        rehydrateSpy.mockRestore();
      }
    });
    it('commits a segment and returns a settled result', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.status).toBe('settled');
      expect(result.segment).toBeDefined();
      expect(result.segment.content).toBe('The road stretches ahead under a gray sky.');
      expect(result.segment.sessionId).toBe('session-1');
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.sessionId).toBe('session-1');
    });

    it('requests a transition when the world clock requires a scene boundary', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag: string) => flag === 'WORLD_CLOCK'
      );
      (buildWorldClockPromptContext as jest.Mock).mockReturnValue({
        currentTurn: 6,
        turnsSinceWorldMoved: 3,
        threads: [],
      });
      (needsSceneTransition as jest.Mock).mockReturnValue(true);
      const generator = makeMockGenerator();

      await resolveTurn(makeCommand(), generator);

      expect(generator.generateSegment).toHaveBeenCalledWith(
        expect.objectContaining({
          generationParameters: expect.objectContaining({
            segmentType: 'transition',
          }),
        }),
        expect.anything()
      );
    });

    it('does not treat a generic transition classification as a world-clock boundary', async () => {
      const makeSegment = (
        id: string,
        type: NarrativeSegment['type'],
        tags: string[] = []
      ): NarrativeSegment => ({
        id,
        sessionId: 'session-1',
        worldId: 'world-1',
        content: id,
        type,
        metadata: { tags },
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      const beforeBoundary = makeSegment('before-boundary', 'scene');
      const boundary = makeSegment('boundary', 'transition');
      useNarrativeStore.setState({
        segments: {
          [beforeBoundary.id]: beforeBoundary,
          [boundary.id]: boundary,
        },
        sessionSegments: {
          'session-1': [beforeBoundary.id, boundary.id],
        },
      });
      const generator = makeMockGenerator();

      await resolveTurn(makeCommand(), generator);

      const generationRequest = (generator.generateSegment as jest.Mock).mock
        .calls[0][0];
      expect(
        generationRequest.narrativeContext.recentSegments.map(
          (segment: NarrativeSegment) => segment.id
        )
      ).toEqual(['before-boundary', 'boundary']);
    });

    it('starts prompt context at the latest resolver-owned world-clock boundary', async () => {
      const makeSegment = (id: string, tags: string[] = []): NarrativeSegment => ({
        id,
        sessionId: 'session-1',
        worldId: 'world-1',
        content: id,
        type: 'scene',
        metadata: { tags },
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      const beforeBoundary = makeSegment('before-boundary');
      const boundary = makeSegment('boundary', ['world-clock-transition']);
      useNarrativeStore.setState({
        segments: {
          [beforeBoundary.id]: beforeBoundary,
          [boundary.id]: boundary,
        },
        sessionSegments: {
          'session-1': [beforeBoundary.id, boundary.id],
        },
      });
      const generator = makeMockGenerator();

      await resolveTurn(makeCommand(), generator);

      const generationRequest = (generator.generateSegment as jest.Mock).mock
        .calls[0][0];
      expect(
        generationRequest.narrativeContext.recentSegments.map(
          (segment: NarrativeSegment) => segment.id
        )
      ).toEqual(['boundary']);
    });

    it('does not request consecutive world-clock boundaries', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag: string) => flag === 'WORLD_CLOCK'
      );
      (buildWorldClockPromptContext as jest.Mock).mockReturnValue({
        currentTurn: 7,
        turnsSinceWorldMoved: 4,
        threads: [],
      });
      (needsSceneTransition as jest.Mock).mockReturnValue(true);
      const boundary: NarrativeSegment = {
        id: 'boundary',
        sessionId: 'session-1',
        worldId: 'world-1',
        content: 'Three days pass.',
        type: 'transition',
        metadata: { tags: ['world-clock-transition'] },
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const itemUse: NarrativeSegment = {
        ...boundary,
        id: 'item-use',
        content: 'You drink the potion.',
        type: 'action',
        metadata: { tags: ['item-usage'] },
      };
      useNarrativeStore.setState({
        segments: { [boundary.id]: boundary, [itemUse.id]: itemUse },
        sessionSegments: { 'session-1': [boundary.id, itemUse.id] },
      });
      const generator = makeMockGenerator();

      await resolveTurn(makeCommand(), generator);

      const generationRequest = (generator.generateSegment as jest.Mock).mock
        .calls[0][0];
      expect(generationRequest.generationParameters).not.toHaveProperty(
        'segmentType'
      );
    });

    it('rejects before commit when an abort-ignoring generator is cancelled', async () => {
      const abortController = new AbortController();
      const generator = makeMockGenerator();
      (generator.generateSegment as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      const turnPromise = resolveTurn(
        makeCommand({
          sessionId: 'session-abort',
          signal: abortController.signal,
        }),
        generator
      );
      await Promise.resolve();
      expect(generator.generateSegment).toHaveBeenCalledTimes(1);

      abortController.abort();
      const result = await Promise.race([
        turnPromise.then(
          () => 'resolved',
          (error) => error
        ),
        new Promise((resolve) => setTimeout(() => resolve('still-pending'), 0)),
      ]);

      expect(result).toMatchObject({ name: 'AbortError' });
      expect(
        useNarrativeStore.getState().getSessionSegments('session-abort')
      ).toHaveLength(0);
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
      // The payload check alone would pass just as happily against a
      // void-fired call, which is the shape narrativeGenerator deliberately
      // uses elsewhere. Hold the processor open and prove the turn waits.
      const acquisitionDeferred = deferred<[]>();
      (processAcquiredItems as jest.Mock).mockReturnValue(
        acquisitionDeferred.promise
      );
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          itemsAcquired: [{ name: 'Iron sword' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      const turnPromise = resolveTurn(command, generator);

      await new Promise((r) => setTimeout(r, 0));
      expect(processAcquiredItems).toHaveBeenCalledWith(
        [{ name: 'Iron sword' }],
        'char-1',
        'session-1',
        expect.any(Function),
        expect.any(String)
      );

      let settled = false;
      turnPromise.then(() => {
        settled = true;
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(settled).toBe(false);

      acquisitionDeferred.resolve([]);
      const resolved = await turnPromise;
      expect(resolved.segment).toBeDefined();
    });

    it('processes lost items synchronously in the turn pipeline', async () => {
      const lossDeferred = deferred<void>();
      (processLostItems as jest.Mock).mockReturnValue(lossDeferred.promise);
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          itemsLost: [{ name: 'Healing potion' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      const turnPromise = resolveTurn(command, generator);

      await new Promise((r) => setTimeout(r, 0));
      expect(processLostItems).toHaveBeenCalledWith(
        [{ name: 'Healing potion' }],
        'char-1',
        'session-1',
        expect.any(Function)
      );

      let settled = false;
      turnPromise.then(() => {
        settled = true;
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(settled).toBe(false);

      lossDeferred.resolve();
      const resolved = await turnPromise;
      expect(resolved.segment).toBeDefined();
    });

    // Fire-and-forget by design in the resolver, so the call itself is the whole
    // guarantee. Nothing later in the turn waits on it.
    it('hands the segment NPC roster to the world during the turn', async () => {
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          characters: [{ id: 'npc-1', name: 'Townsperson', description: 'A local' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(syncNpcMetadata).toHaveBeenCalledWith('world-1', [
        { id: 'npc-1', name: 'Townsperson', description: 'A local' },
      ]);
    });

    it('stamps fatal-outcome tag from world cost reconciliation', async () => {
      (applyWorldClockUpdates as jest.Mock).mockResolvedValueOnce({
        worldCost: { applied: true, fatal: true, message: 'Fatigue claims you' },
      });
      const generator = makeMockGenerator();
      const command = makeCommand();

      const turnResult = await resolveTurn(command, generator);

      expect(turnResult.segment.metadata?.tags).toContain('fatal-outcome');
      expect(turnResult.isFatal).toBe(true);
    });

    it('marks isFatal from a critical failure command without setting isEnding', async () => {
      const generator = makeMockGenerator();
      const command = makeCommand({ isFatalCriticalFailure: true });

      const turnResult = await resolveTurn(command, generator);

      expect(turnResult.isFatal).toBe(true);
      expect(turnResult.isEnding).toBe(false);
    });

    it('post-turn snapshot reflects the committed segment', async () => {
      const generator = makeMockGenerator(
        makeGenerationResult({ content: 'A unique narrative beat.' })
      );
      const command = makeCommand();

      const turnResult = await resolveTurn(command, generator);

      expect(turnResult.snapshot.segments.length).toBeGreaterThan(0);
      expect(
        turnResult.snapshot.segments[turnResult.snapshot.segments.length - 1].content
      ).toBe('A unique narrative beat.');
    });

    it('returns an explicit partial result when reconciliation fails', async () => {
      (applyWorldClockUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('database unavailable')
      );
      const generator = makeMockGenerator();
      const command = makeCommand();

      const turnResult = await resolveTurn(command, generator);

      expect(turnResult.status).toBe('partial');
      expect(turnResult.reconciliationErrors.length).toBeGreaterThan(0);
    });

    it('captures reconciliation failures reported by fail-open helpers', async () => {
      (applyWorldClockUpdates as jest.Mock).mockImplementationOnce(
        async ({ onError }: { onError?: (err: unknown) => void }) => {
          onError?.(new Error('world clock non-fatal'));
          return null;
        }
      );
      const generator = makeMockGenerator();
      const command = makeCommand();

      const result = await resolveTurn(command, generator);

      expect(result.status).toBe('partial');
      expect(result.reconciliationErrors).toEqual([
        expect.objectContaining({ step: 'worldClock' }),
      ]);
    });

    it('fires lore extraction as fire-and-forget when flag is off', async () => {
      const generator = makeMockGenerator();
      await resolveTurn(makeCommand(), generator);

      expect(extractStructuredLore).toHaveBeenCalledTimes(1);
    });

    it('awaits lore extraction when SETTLED_COMMITMENT_CHOICES is enabled and passes acquired items', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag: string) => flag === 'SETTLED_COMMITMENT_CHOICES'
      );
      (processAcquiredItems as jest.Mock).mockResolvedValueOnce([{ id: 'key-1', name: 'Master Key' }]);

      const generator = makeMockGenerator(
        makeGenerationResult({
          content: 'You receive the master key.',
          metadata: {
            characterIds: [],
            tags: [],
            itemsAcquired: [{ name: 'Master Key' }],
          },
        })
      );

      const result = await resolveTurn(makeCommand(), generator);

      expect(result.status).toBe('settled');
      expect(extractStructuredLore).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          acquiredItems: [{ id: 'key-1', name: 'Master Key' }],
        })
      );

      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    });

    it('fails open if lore extraction throws under SETTLED_COMMITMENT_CHOICES without marking turn partial', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag: string) => flag === 'SETTLED_COMMITMENT_CHOICES'
      );
      (extractStructuredLore as jest.Mock).mockRejectedValueOnce(new Error('AI extraction timeout'));

      const generator = makeMockGenerator();
      const result = await resolveTurn(makeCommand(), generator);

      expect(result.status).toBe('settled');
      expect(result.reconciliationErrors).toEqual([]);

      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    });

    it('passes playerCharacterName to lore extraction', async () => {
      const generator = makeMockGenerator();
      await resolveTurn(makeCommand(), generator);

      expect(extractStructuredLore).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ playerCharacterName: 'Test Character' })
      );
    });

    it('passes unattestedSpeakers to lore extraction when continuity reports invented-exchange issues', async () => {
      const generator = makeMockGenerator(
        makeGenerationResult({
          metadata: {
            characterIds: [],
            tags: [],
            continuity: {
              status: 'flagged',
              remainingIssues: [
                { type: 'invented-exchange', entity: 'Davies' },
                { type: 'reversed-fact', entity: 'Rowan' },
                { type: 'invented-exchange', entity: 'Marcus' },
              ],
            },
          },
        })
      );
      await resolveTurn(makeCommand(), generator);

      expect(extractStructuredLore).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ unattestedSpeakers: ['Davies', 'Marcus'] })
      );
    });

    it('omits unattestedSpeakers from lore extraction options when no invented-exchange issues are present', async () => {
      const generator = makeMockGenerator(
        makeGenerationResult({
          metadata: {
            characterIds: [],
            tags: [],
            continuity: {
              status: 'flagged',
              remainingIssues: [
                { type: 'reversed-fact', entity: 'Old Man Rowan' },
              ],
            },
          },
        })
      );
      await resolveTurn(makeCommand(), generator);

      expect(extractStructuredLore).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.not.objectContaining({ unattestedSpeakers: expect.anything() })
      );
    });

    it('records lore mentions for resolved narrative segment', async () => {
      const generator = makeMockGenerator(
        makeGenerationResult({ content: 'The ancient crystal pulses with magic.' })
      );
      await resolveTurn(makeCommand(), generator);

      expect(checkAndRecordLoreMentions).toHaveBeenCalledWith(
        'world-1',
        'session-1',
        'The ancient crystal pulses with magic.',
        'narrative'
      );
    });

    it('does not record lore mentions on initial turn to prevent duplicate recording', async () => {
      const generator = makeMockGenerator(
        makeGenerationResult({ content: 'Opening scene content.' })
      );
      await resolveInitialTurn(
        {
          sessionId: 'session-1',
          worldId: 'world-1',
          characterId: 'char-1',
          generateChoices: true,
        },
        generator
      );

      expect(checkAndRecordLoreMentions).not.toHaveBeenCalled();
    });

    it('fails open if checkAndRecordLoreMentions throws without marking turn partial', async () => {
      (checkAndRecordLoreMentions as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Lore mention tracking failed');
      });

      const generator = makeMockGenerator();
      const result = await resolveTurn(makeCommand(), generator);

      expect(result.status).toBe('settled');
      expect(result.reconciliationErrors).toEqual([]);
    });

    it('preserves debugInfo on resolved segment metadata', async () => {
      const debugInfo = {
        fullPrompt: 'test prompt',
        templateName: 'Scene Template',
        modelUsed: 'gemini-2.5-flash',
        generatedAt: new Date(),
      };
      const generator = makeMockGenerator(
        makeGenerationResult({
          metadata: {
            characterIds: [],
            tags: [],
            debugInfo,
          },
        })
      );
      const result = await resolveTurn(makeCommand(), generator);

      expect(result.segment.metadata?.debugInfo).toEqual(debugInfo);
    });

    it('passes authoritative characterId to reconciliation, not the session singleton', async () => {
      // Point the session singleton at a different character
      useSessionStore.setState({
        id: 'session-1',
        worldId: 'world-1',
        characterId: 'other-char',
        status: 'active',
      } as never);

      const generator = makeMockGenerator();
      await resolveTurn(makeCommand({ characterId: 'char-1' }), generator);

      // applyWorldClockUpdates should receive the command's characterId,
      // not the session singleton's 'other-char'
      expect(applyWorldClockUpdates).toHaveBeenCalledWith(
        expect.objectContaining({ playerCharacterId: 'char-1' })
      );
      expect(applyWorldStateThreadUpdates).toHaveBeenCalledWith(
        expect.objectContaining({ characterId: 'char-1' })
      );
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

  describe('resolveItemUseTurn', () => {
    it('keeps replacement-choice context behind the latest world-clock boundary', async () => {
      const ids = seedItemUseStores();
      const beforeBoundary: NarrativeSegment = {
        id: 'before-boundary',
        sessionId: ids.sessionId,
        worldId: ids.worldId,
        content: 'The old room lingers.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const boundary: NarrativeSegment = {
        ...beforeBoundary,
        id: 'boundary',
        content: 'Three days later, you reach the council hall.',
        type: 'transition',
        metadata: { tags: ['world-clock-transition'] },
      };
      useNarrativeStore.setState({
        segments: {
          [beforeBoundary.id]: beforeBoundary,
          [boundary.id]: boundary,
        },
        sessionSegments: {
          [ids.sessionId]: [beforeBoundary.id, boundary.id],
        },
      });
      const generator = makeItemUseGenerator();

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      const choiceContext = (generator.generatePlayerChoices as jest.Mock).mock
        .calls[0][1];
      expect(
        choiceContext.recentSegments.map(
          (segment: NarrativeSegment) => segment.content
        )
      ).toEqual([
        'Three days later, you reach the council hall.',
        'You drink the potion and warmth returns to your limbs.',
      ]);
    });

    it('keeps replacement choices blocked until reconciliation settles', async () => {
      const ids = seedItemUseStores();
      const clockDeferred = deferred<null>();
      (applyWorldClockUpdates as jest.Mock).mockReturnValue(clockDeferred.promise);
      const generator = makeItemUseGenerator();

      useNarrativeStore.getState().addDecision(ids.sessionId, {
        prompt: 'Existing decision',
        options: [{ id: 'existing-1', text: 'Wait' }],
      });

      const itemTurnPromise = resolveItemUseTurn(ids, generator);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(generator.generatePlayerChoices).not.toHaveBeenCalled();
      expect(
        useNarrativeStore.getState().getSessionDecisions(ids.sessionId)
      ).toEqual([
        expect.objectContaining({ prompt: 'Existing decision' }),
      ]);

      clockDeferred.resolve(null);
      const outcome = await itemTurnPromise;

      expect(outcome.success).toBe(true);
      expect(generator.generateSegment).toHaveBeenCalledWith(
        expect.any(Object)
      );
      expect(generator.generatePlayerChoices).toHaveBeenCalledTimes(1);
      expect(
        useNarrativeStore.getState().getSessionDecisions(ids.sessionId)
      ).toEqual([
        expect.objectContaining({ prompt: 'What do you do next?' }),
      ]);
    });

    it('serializes item generation, replacement choices, and a concurrent controller turn', async () => {
      const ids = seedItemUseStores();
      const callOrder: string[] = [];
      const itemGenerator = makeItemUseGenerator();
      (itemGenerator.generateSegment as jest.Mock).mockImplementation(async () => {
        callOrder.push('item-generation');
        return makeGenerationResult({
          content: 'You drink the potion.',
          segmentType: 'action',
          metadata: { characterIds: [], tags: ['item-usage'] },
        });
      });
      (itemGenerator.generatePlayerChoices as jest.Mock).mockImplementation(
        async () => {
          callOrder.push('item-choices');
          return {
            prompt: 'What follows?',
            options: [{ id: 'option-1', text: 'Keep moving' }],
          };
        }
      );
      const controllerGenerator = makeMockGenerator();
      (controllerGenerator.generateSegment as jest.Mock).mockImplementation(
        async () => {
          callOrder.push('controller-generation');
          return makeGenerationResult();
        }
      );

      const [itemOutcome, controllerResult] = await Promise.all([
        resolveItemUseTurn(ids, itemGenerator),
        resolveTurn(
          makeCommand({
            sessionId: ids.sessionId,
            worldId: ids.worldId,
            characterId: ids.characterId,
          }),
          controllerGenerator
        ),
      ]);

      expect(itemOutcome.success).toBe(true);
      expect(controllerResult.status).toBe('settled');
      expect(callOrder).toEqual([
        'item-generation',
        'item-choices',
        'controller-generation',
      ]);
      expect(
        useNarrativeStore.getState().getSessionSegments(ids.sessionId)
      ).toHaveLength(2);
      expect(applyWorldClockUpdates).toHaveBeenCalledTimes(2);
      expect(useInventoryStore.getState().items[ids.itemId]?.quantity).toBe(1);
    });

    it('consumes the explicit item once while reconciling other reported losses', async () => {
      const ids = seedItemUseStores(3);
      const generator = makeItemUseGenerator(
        makeGenerationResult({
          content: 'You drink the potion and drop an old key.',
          segmentType: 'action',
          metadata: {
            characterIds: [],
            tags: ['item-usage'],
            itemsLost: [
              {
                itemId: ids.itemId,
                name: 'Healing Potion',
                quantity: 1,
                lossReason: 'consumed',
              },
              { name: 'Old Key', quantity: 1, lossReason: 'dropped' },
            ],
          },
        })
      );

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      expect(useInventoryStore.getState().items[ids.itemId]?.quantity).toBe(2);
      expect(processLostItems).toHaveBeenCalledWith(
        [{ name: 'Old Key', quantity: 1, lossReason: 'dropped' }],
        ids.characterId,
        ids.sessionId,
        expect.any(Function)
      );
    });

    it('excludes a pluralized loss record for the consumed item', async () => {
      const ids = seedItemUseStores(3);
      useInventoryStore.getState().update(ids.itemId, { name: 'Health Potion' });
      const generator = makeItemUseGenerator(
        makeGenerationResult({
          content: 'You drink one of the health potions.',
          segmentType: 'action',
          metadata: {
            characterIds: [],
            tags: ['item-usage'],
            itemsLost: [
              {
                name: 'health potions',
                quantity: 2,
                lossReason: 'consumed',
              },
            ],
          },
        })
      );

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      expect(useInventoryStore.getState().items[ids.itemId]?.quantity).toBe(2);
      expect(processLostItems).not.toHaveBeenCalled();
    });

    it('reconciles genuine loss metadata when the used item was not consumed', async () => {
      const ids = seedItemUseStores();
      const questItemId = useInventoryStore.getState().addItem(
        ids.characterId,
        {
          name: 'Ancient Amulet',
          description: 'A relic bound to the old kingdom',
          stackable: false,
          quantity: 1,
          categorization: {
            categoryId: 'quest-items',
            source: 'manual',
            classifiedAt: new Date().toISOString(),
          },
          acquisition: {
            method: 'loot',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        }
      );
      const command = { ...ids, itemId: questItemId };
      const generator = makeItemUseGenerator(
        makeGenerationResult({
          content: 'The ancient amulet cracks and falls to dust.',
          segmentType: 'action',
          metadata: {
            characterIds: [],
            tags: ['item-usage'],
            itemsLost: [
              {
                itemId: questItemId,
                name: 'Ancient Amulet',
                quantity: 1,
                lossReason: 'destroyed',
              },
            ],
          },
        })
      );

      const outcome = await resolveItemUseTurn(command, generator);

      expect(outcome.success).toBe(true);
      expect(processLostItems).toHaveBeenCalledWith(
        [
          {
            itemId: questItemId,
            name: 'Ancient Amulet',
            quantity: 1,
            lossReason: 'destroyed',
          },
        ],
        ids.characterId,
        ids.sessionId,
        expect.any(Function)
      );
    });

    it('infers and reconciles another item lost in item-use prose', async () => {
      const ids = seedItemUseStores(3);
      useInventoryStore.getState().addItem(ids.characterId, {
        name: 'Old Key',
        description: 'A tarnished iron key',
        stackable: false,
        quantity: 1,
        categorization: {
          categoryId: 'miscellaneous',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
      inferItemsLostFromNarrative.mockImplementationOnce(
        inferItemsLostFromNarrativeActual
      );
      const generator = makeItemUseGenerator(
        makeGenerationResult({
          content:
            'Healing magic surges through you as the old key is dropped into the chasm.',
          segmentType: 'action',
          metadata: { characterIds: [], tags: ['item-usage'] },
        })
      );

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      expect(processLostItems).toHaveBeenCalledWith(
        [{ name: 'Old Key', quantity: 1, lossReason: 'dropped' }],
        ids.characterId,
        ids.sessionId,
        expect.any(Function)
      );
      expect(processAcquiredItems).not.toHaveBeenCalled();
    });

    it('commits fallback prose and blocks choices when reconciliation is partial', async () => {
      const ids = seedItemUseStores();
      const generator = makeItemUseGenerator();
      (generator.generateSegment as jest.Mock).mockRejectedValue(
        new Error('provider unavailable')
      );
      (applyWorldClockUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('clock unavailable')
      );
      useNarrativeStore.getState().addDecision(ids.sessionId, {
        prompt: 'Existing decision',
        options: [{ id: 'existing-1', text: 'Wait' }],
      });

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      if (!outcome.success) {
        throw new Error('Expected item use to commit');
      }
      expect(outcome.turn.status).toBe('partial');
      expect(outcome.turn.segment.content).toContain('Healing Potion');
      expect(generator.generatePlayerChoices).not.toHaveBeenCalled();
      expect(
        useNarrativeStore.getState().getSessionDecisions(ids.sessionId)
      ).toEqual([
        expect.objectContaining({ prompt: 'Existing decision' }),
      ]);
      expect(useNarrativeStore.getState().generationError).toEqual(
        PARTIAL_RECONCILIATION_ERROR
      );
    });

    it('rejects a queued item use after partial settlement before another mutation or generation', async () => {
      const ids = seedItemUseStores();
      const firstGenerator = makeItemUseGenerator();
      const secondGenerator = makeItemUseGenerator();
      (applyWorldClockUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('clock unavailable')
      );

      const firstTurn = resolveItemUseTurn(ids, firstGenerator);
      const secondTurn = resolveItemUseTurn(ids, secondGenerator);
      const [firstOutcome, secondOutcome] = await Promise.all([
        firstTurn,
        secondTurn,
      ]);

      expect(firstOutcome.success).toBe(true);
      if (!firstOutcome.success) {
        throw new Error('Expected the partially settled item use to commit');
      }
      expect(firstOutcome.turn.status).toBe('partial');
      expect(secondOutcome).toMatchObject({
        success: false,
        error: {
          title: PARTIAL_RECONCILIATION_ERROR.title,
          message: PARTIAL_RECONCILIATION_ERROR.message,
        },
      });
      expect(useInventoryStore.getState().items[ids.itemId]?.quantity).toBe(1);
      expect(firstGenerator.generateSegment).toHaveBeenCalledTimes(1);
      expect(secondGenerator.generateSegment).not.toHaveBeenCalled();
      expect(useNarrativeStore.getState().generationError).toEqual(
        PARTIAL_RECONCILIATION_ERROR
      );
    });

    it('does not apply the active session pause to another session', async () => {
      const ids = seedItemUseStores(3);
      (applyWorldClockUpdates as jest.Mock).mockRejectedValueOnce(
        new Error('clock unavailable')
      );
      await resolveItemUseTurn(ids, makeItemUseGenerator());
      const otherSessionGenerator = makeItemUseGenerator();

      const outcome = await resolveItemUseTurn(
        { ...ids, sessionId: 'session-other' },
        otherSessionGenerator
      );

      expect(outcome.success).toBe(true);
      expect(otherSessionGenerator.generateSegment).toHaveBeenCalledTimes(1);
      expect(useInventoryStore.getState().items[ids.itemId]?.quantity).toBe(1);
    });

    it('keeps existing decisions when replacement choice generation fails', async () => {
      const ids = seedItemUseStores();
      const generator = makeItemUseGenerator();
      (generator.generatePlayerChoices as jest.Mock).mockRejectedValue(
        new Error('choice provider unavailable')
      );
      useNarrativeStore.getState().addDecision(ids.sessionId, {
        prompt: 'Existing decision',
        options: [{ id: 'existing-1', text: 'Wait' }],
      });

      const outcome = await resolveItemUseTurn(ids, generator);

      expect(outcome.success).toBe(true);
      expect(
        useNarrativeStore.getState().getSessionDecisions(ids.sessionId)
      ).toEqual([
        expect.objectContaining({ prompt: 'Existing decision' }),
      ]);
    });

    it('projects recorded scene beats into the item-use prompt and keeps flag-off prompts identical', async () => {
      const ids = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().recordBeat(ids.sessionId, {
        id: 'gate-opened',
        text: 'The rusted gate swung open.',
        turnIndex: 1,
      });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag: string) => flag === 'SCENE_STATE'
      );

      try {
        const flagOnGenerator = makeItemUseGenerator();
        await resolveItemUseTurn(ids, flagOnGenerator);

        const { narrativeContext: flagOnContext } = (
          flagOnGenerator.generateSegment as jest.Mock
        ).mock.calls[0][0];
        expect(flagOnContext.sceneState?.completedBeats).toEqual([
          { id: 'gate-opened', text: 'The rusted gate swung open.', turnIndex: 1 },
        ]);
        const flagOnPrompt = actionTemplate({
          worldName: 'Test World',
          genre: 'fantasy',
          tone: 'tense',
          narrativeContext: flagOnContext,
        });
        expect(flagOnPrompt).toContain(
          '[gate-opened] (turn 1): The rusted gate swung open.'
        );
        expect(flagOnPrompt).not.toContain('None recorded yet.');
      } finally {
        (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      }

      const offIds = seedItemUseStores();
      useSceneStore.setState({ scenes: {} });
      useSceneStore.getState().recordBeat(offIds.sessionId, {
        id: 'gate-opened',
        text: 'The rusted gate swung open.',
        turnIndex: 1,
      });
      const flagOffGenerator = makeItemUseGenerator();
      await resolveItemUseTurn(offIds, flagOffGenerator);

      const { narrativeContext: flagOffContext } = (
        flagOffGenerator.generateSegment as jest.Mock
      ).mock.calls[0][0];
      expect(flagOffContext.sceneState).toBeUndefined();
      const flagOffPrompt = actionTemplate({
        worldName: 'Test World',
        genre: 'fantasy',
        tone: 'tense',
        narrativeContext: flagOffContext,
      });
      const baselinePrompt = actionTemplate({
        worldName: 'Test World',
        genre: 'fantasy',
        tone: 'tense',
        narrativeContext: {
          ...flagOffContext,
          sceneState: {
            location: 'Muddy Lake',
            presentNpcNames: ['Guard'],
            completedBeats: [
              { id: 'gate-opened', text: 'The rusted gate swung open.', turnIndex: 1 },
            ],
          },
        },
      });
      expect(flagOffPrompt).toBe(baselinePrompt);
      expect(flagOffPrompt).not.toContain('gate-opened');
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
    it('leaves the fallback location unset until the model names a place', async () => {
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const generator = makeMockGenerator(makeGenerationResult({
        metadata: { characterIds: [], tags: [], location: FIRST_SEGMENT_LOCATION },
      }));
      (generator.generateSegment as jest.Mock).mockResolvedValue(makeGenerationResult({
        metadata: { characterIds: [], tags: [], location: 'Council room' },
      }));

      const opening = await resolveInitialTurn(
        { sessionId: 'session-1', worldId: 'world-1', characterId: 'char-1', generateChoices: false },
        generator
      );
      expect(opening.snapshot.sceneState?.location).toBeNull();

      const next = await resolveTurn(makeCommand(), generator);
      expect(next.snapshot.sceneState?.location).toBe('Council room');
    });

    it('records the opening location with SCENE_STATE enabled', async () => {
      useSceneStore.setState({ scenes: {} });
      const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
      (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
      const result = await resolveInitialTurn(
        { sessionId: 'session-1', worldId: 'world-1', characterId: 'char-1', generateChoices: false },
        makeMockGenerator()
      );
      expect(result.snapshot.sceneState?.location).toBe('The road');
    });

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

      expect(result.status).toBe('partial');
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
    useSceneStore.setState({ scenes: {} });
    const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
  });

  it('keeps the full snapshot equal with the scene flag off and exposes frozen scene facts when on', () => {
    const originalSnapshot = assembleSessionSnapshot('session-1');
    const store = useSceneStore.getState();
    store.setLocation('session-1', 'Kitchen');
    store.setPresentNpcIds('session-1', ['npc-1']);
    store.recordBeat('session-1', { id: 'arrival', text: 'The bus arrived', turnIndex: 11 });
    store.setLocation('session-2', 'Council room');

    expect(assembleSessionSnapshot('session-1')).toEqual(originalSnapshot);

    const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
    (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
    const snapshot = assembleSessionSnapshot('session-1');
    expect(snapshot.sceneState).toEqual({
      location: 'Kitchen',
      presentNpcIds: ['npc-1'],
      completedBeats: [{ id: 'arrival', text: 'The bus arrived', turnIndex: 11 }],
    });
    expect(Object.isFrozen(snapshot.sceneState)).toBe(true);
    expect(Object.isFrozen(snapshot.sceneState?.presentNpcIds)).toBe(true);
    expect(Object.isFrozen(snapshot.sceneState?.completedBeats[0])).toBe(true);
    expect(assembleSessionSnapshot('session-3').sceneState).toBeUndefined();
  });

  it('projects the last recorded location before a scene-store record exists', () => {
    useNarrativeStore.getState().addSegment('session-1', {
      content: 'You stand beside the lake.',
      type: 'scene',
      characterIds: [],
      metadata: { characterIds: [], tags: [], location: 'Muddy Lake' },
      worldId: 'world-1',
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });
    const { isFeatureEnabled } = jest.requireMock('@/lib/featureFlags');
    (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');

    expect(assembleSessionSnapshot('session-1').sceneState).toEqual({
      location: 'Muddy Lake', presentNpcIds: [], completedBeats: [],
    });
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
