import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { useCharacterStore } from '@/state/characterStore';
import type { Character as StoreCharacter } from '@/state/characterStore';

// The template registry is deliberately NOT mocked here. Every other suite
// stubs it out, which is why a contradiction between the aligned template and
// the appended personality section could sit in the real prompt unnoticed.

jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(() => ''),
}));

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: jest.fn(() => []),
    }),
  },
}));

jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn().mockReturnValue({
      getNPCsByWorld: jest.fn(() => []),
    }),
  },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn(),
  },
}));

const playerCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Player One',
  description: 'Test character',
  worldId: 'world-1',
  level: 1,
  attributes: [],
  skills: [],
  derivedStats: [],
  background: {
    history: 'Former explorer',
    personality: 'cautious, diplomatic, curious',
    goals: ['Find the artifact'],
    fears: ['Darkness'],
    relationships: [],
  },
  isPlayer: true,
  status: { health: 10, maxHealth: 10, conditions: [] },
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 10,
    categories: [],
    itemOrder: [],
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['char-1'],
  previousSegments: [],
  currentTags: [],
  sessionId: 'session-1',
  currentLocation: 'Forest',
  currentSituation: 'Exploring',
};

const buildAlignedPrompt = (): string =>
  buildChoicePrompt({
    world: createMockWorld({ id: 'world-1', name: 'Test World' }),
    worldId: 'world-1',
    narrativeContext,
    characterIds: ['char-1'],
    sessionId: 'session-1',
    includeDecisionHistory: false,
    useAlignedChoices: true,
  });

describe('assembled aligned choice prompt', () => {
  beforeEach(() => {
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: { 'char-1': playerCharacter },
    });
  });

  it('asks for three options', () => {
    expect(buildAlignedPrompt()).toContain('create 3 distinct action choices');
  });

  it('never mandates an alignment distribution, in the template or in anything appended to it', () => {
    const prompt = buildAlignedPrompt();

    expect(prompt).toContain('CHARACTER PERSONALITY CONTEXT:');
    expect(prompt).not.toMatch(/required alignment distribution/i);
    expect(prompt).not.toMatch(/NOT the distribution/i);
    expect(prompt).not.toContain('1 lawful, 2 neutral, 1 chaotic');
  });
});
