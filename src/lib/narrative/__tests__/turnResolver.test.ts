import {
  resolveTurn,
  resolveInitialTurn,
  resolveItemUseTurn,
} from '../turnResolver';
import { isResolverManaged } from '../resolverGuard';
import { assembleSessionSnapshot } from '../sessionSnapshotAssembler';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useWorldStore } from '@/state/worldStore';
import { PARTIAL_RECONCILIATION_ERROR } from '@/lib/narrative/narrativeErrors';
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
        'session-1',
        expect.any(Function),
        expect.any(String)
      );
    });

    it('processes lost items synchronously in the turn pipeline', async () => {
      const result = makeGenerationResult({
        metadata: {
          characterIds: [],
          tags: [],
          itemsLost: [{ name: 'Healing potion' }],
        },
      });
      const generator = makeMockGenerator(result);
      const command = makeCommand();

      await resolveTurn(command, generator);

      expect(processLostItems).toHaveBeenCalledWith(
        [{ name: 'Healing potion' }],
        'char-1',
        'session-1',
        expect.any(Function)
      );
    });

    it('calls syncNpcMetadata', async () => {
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
        expect.any(Object),
        { resolverManaged: true }
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
