/**
 * A natural 1 on a pivotal decision is allowed to end a story, but the model
 * decides which decisions are pivotal and a high-tension world marks nearly
 * all of them. The controller has to space those lethal moments out, so a
 * long run is not decided by whichever early turn happens to roll a 1.
 */

import React from 'react';
import { act, render } from '@testing-library/react';

import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import {
  createMockCharacter,
  createMockCharacterStore,
  createMockNarrativeStore,
  createMockNPCStore,
  createMockWorld,
  createMockWorldStore,
  mockZustandStore,
} from '@/lib/test-utils';
import { ToastProvider } from '@/components/ui/toast/toaster';
import { FATAL_DECISION_COOLDOWN_TURNS } from '@/lib/narrative/fatalDecisionCadence';
import { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';
import type { NarrativeSegment } from '@/types/narrative.types';

const mockGenerateSegment = jest.fn();
const mockAddSegment = jest.fn();

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));
jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateSegment: mockGenerateSegment,
    generatePlayerChoices: jest.fn(),
  })),
}));
jest.mock('@/utils/skillCheckEvaluator', () => ({
  evaluateSkillCheck: jest.fn(),
}));
jest.mock('@/state/narrativeStore', () => ({ useNarrativeStore: jest.fn() }));
jest.mock('@/state/characterStore', () => ({ useCharacterStore: jest.fn() }));
jest.mock('@/state/worldStore', () => ({ useWorldStore: jest.fn() }));
jest.mock('@/state/npcStore', () => ({ useNPCStore: jest.fn() }));

const mockResolveTurn = jest.fn();
jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: (...args: unknown[]) => mockResolveTurn(...args),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

const mockEvaluateSkillCheck = evaluateSkillCheck as jest.MockedFunction<
  typeof evaluateSkillCheck
>;

const naturalOne = {
  diceRoll: 1,
  skillLevel: 3,
  attributeBonus: 1,
  total: 5,
  dc: 20,
  success: false,
  isCriticalSuccess: false,
  isCriticalFailure: true,
  skillId: 'nerve-skill',
  skillName: 'Nerve',
  timestamp: new Date().toISOString(),
};

const makeSegment = (index: number, fatalRiskAllowed?: boolean): NarrativeSegment => ({
  id: `seg-${index}`,
  content: 'The cabin door holds, for now.',
  type: 'scene',
  sessionId: 'test-session',
  worldId: 'test-world',
  characterIds: [],
  metadata: { tags: [], fatalRiskAllowed },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const testCharacter = createMockCharacter({
  id: 'test-character',
  worldId: 'test-world',
  skills: [
    {
      id: 'nerve-skill',
      characterId: 'test-character',
      worldSkillId: 'nerve-skill',
      name: 'Nerve',
      level: 3,
    },
  ],
});

const testWorld = createMockWorld({ id: 'test-world', genre: 'horror' });

const criticalDecision = {
  id: 'decision-1',
  prompt: 'The door splinters. What do you do?',
  decisionWeight: 'critical' as const,
  options: [
    {
      id: 'choice-1',
      text: 'Hold the door',
      alignment: 'neutral' as const,
      isCustomInput: false,
      requirements: [
        { type: 'skill' as const, targetId: 'nerve-skill', value: 10 },
      ],
    },
  ],
};

const seedStores = (segments: NarrativeSegment[]) => {
  mockZustandStore(
    useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
    createMockNarrativeStore({
      _hasHydrated: true,
      addSegment: mockAddSegment,
      getSessionSegments: jest.fn().mockReturnValue(segments),
      getSessionDecisions: jest.fn().mockReturnValue([criticalDecision]),
    })
  );
  mockZustandStore(
    useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
    createMockCharacterStore({
      characters: { 'test-character': testCharacter },
    })
  );
  mockZustandStore(
    useWorldStore as jest.MockedFunction<typeof useWorldStore>,
    createMockWorldStore({ worlds: { 'test-world': testWorld } })
  );
  mockZustandStore(
    useNPCStore as jest.MockedFunction<typeof useNPCStore>,
    createMockNPCStore()
  );
};

const playCriticalTurn = async (
  segments: NarrativeSegment[],
  onEndingSuggested: jest.Mock
) => {
  seedStores(segments);
  await act(async () => {
    render(
      <ToastProvider>
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          characterId="test-character"
          choiceId="choice-1"
          triggerGeneration={true}
          generateChoices={false}
          onEndingSuggested={onEndingSuggested}
        />
      </ToastProvider>
    );
  });
};

const quietTurns = (count: number) =>
  Array.from({ length: count }, (_, index) => makeSegment(index));

describe('NarrativeController - fatal cadence on pivotal decisions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEvaluateSkillCheck.mockReturnValue(naturalOne);
    mockGenerateSegment.mockResolvedValue({
      content: 'The door gives way.',
      segmentType: 'scene',
      metadata: { characterIds: [], tags: [] },
    });
    mockResolveTurn.mockResolvedValue({
      segment: {
        id: 'seg-resolved',
        content: 'The door gives way.',
        type: 'scene',
        sessionId: 'test-session',
        worldId: 'test-world',
        characterIds: [],
        metadata: { characterIds: [], tags: [] },
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      snapshot: { sessionId: 'test-session' },
      status: 'settled',
      isFatal: false,
      isEnding: false,
      reconciliationErrors: [],
    });
  });

  it('does not end the run on a natural 1 while the fatal cadence is on cooldown', async () => {
    const onEndingSuggested = jest.fn();
    await playCriticalTurn(quietTurns(3), onEndingSuggested);

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('ends the run on a natural 1 once the cadence is off cooldown', async () => {
    const onEndingSuggested = jest.fn();
    await playCriticalTurn(quietTurns(FATAL_DECISION_COOLDOWN_TURNS), onEndingSuggested);

    expect(onEndingSuggested).toHaveBeenCalledTimes(1);
    expect(onEndingSuggested.mock.calls[0][0]).toMatch(/^fatal:/);
  });

  it('records the spent fatal risk on the command so the resolver stamps it', async () => {
    await playCriticalTurn(quietTurns(FATAL_DECISION_COOLDOWN_TURNS), jest.fn());

    expect(mockResolveTurn).toHaveBeenCalled();
    const command = mockResolveTurn.mock.calls[0][0];
    expect(command.fatalRiskAllowed).toBe(true);
  });

  it('leaves the marker off a turn whose pivotal decision could not be fatal', async () => {
    await playCriticalTurn(quietTurns(3), jest.fn());

    expect(mockResolveTurn).toHaveBeenCalled();
    const command = mockResolveTurn.mock.calls[0][0];
    expect(command.fatalRiskAllowed).toBe(false);
  });
});
