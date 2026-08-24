import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { useCharacterStore } from '@/state/characterStore';
import type { Character as StoreCharacter } from '@/state/characterStore';

jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  getNarrativeTemplate: jest.fn().mockReturnValue((context: { worldName: string }) =>
    `BASE_PROMPT:${context.worldName}`
  ),
}));

jest.mock('../toneSettingsGuidance', () => ({
  getDetailedToneInstructions: jest.fn(() => '\nTONE_GUIDANCE'),
}));

jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(() => '\nLORE_CONTEXT'),
}));

jest.mock('@/lib/promptContext/inventoryContextBuilder', () => ({
  buildInventoryContext: jest.fn(() => ({ context: 'INVENTORY_CONTEXT' })),
}));

jest.mock('../attributeSkillFormatter', () => ({
  formatSkillsForNarrative: jest.fn(() => 'Stealth (Novice)'),
}));

jest.mock('../playerDecisionTracker', () => ({
  playerDecisionTracker: {
    getRelevantDecisions: jest.fn(() => []),
  },
}));

jest.mock('../simpleDecisionFormatter', () => ({
  formatDecisions: jest.fn(() => 'DECISION_HISTORY'),
}));

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: jest.fn(() => []),
    }),
  },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn(),
  },
}));

const createStoreCharacter = (
  overrides: Partial<StoreCharacter> = {}
): StoreCharacter => ({
  id: 'char-1',
  name: 'Player One',
  description: 'Test character',
  worldId: 'world-1',
  level: 1,
  attributes: [],
  skills: [
    {
      id: 'skill-1',
      characterId: 'char-1',
      worldSkillId: 'world-skill-1',
      name: 'Stealth',
      level: 1,
      category: 'General',
    },
  ],
  derivedStats: [],
  background: {
    history: 'Former explorer',
    personality: 'cautious, diplomatic, curious',
    goals: ['Find the artifact'],
    fears: ['Darkness'],
    relationships: [],
  },
  isPlayer: true,
  status: {
    conditions: [],
  },
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 10,
    categories: [],
    itemOrder: [],
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  ...overrides,
});

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['npc-1', 'char-1'],
  previousSegments: [],
  currentTags: [],
  sessionId: 'session-1',
  currentLocation: 'Forest',
  currentSituation: 'Exploring',
};

describe('buildChoicePrompt personality integration', () => {
  beforeEach(() => {
    const playerCharacter = createStoreCharacter({
      id: 'char-1',
      name: 'Player One',
      isPlayer: true,
    });
    const npcCharacter = createStoreCharacter({
      id: 'npc-1',
      name: 'NPC',
      isPlayer: false,
      background: {
        history: 'Troublemaker',
        personality: 'reckless',
        goals: [],
        fears: [],
        relationships: [],
      },
    });

    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: {
        'char-1': playerCharacter,
        'npc-1': npcCharacter,
      },
    });
  });

  it('includes personality context for the player character', () => {
    const world = createMockWorld({ id: 'world-1', name: 'Test World' });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['npc-1', 'char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      useAlignedChoices: false,
    });

    expect(prompt).toContain('CHARACTER PERSONALITY CONTEXT:');
    expect(prompt).toContain('cautious, diplomatic, curious');
    expect(prompt).not.toContain('reckless');
    expect(prompt).toContain(
      'Lawful/neutral/chaotic alignment should consider personality:'
    );
  });

  it('gates alignment hints for aligned choice prompts', () => {
    const world = createMockWorld({ id: 'world-1', name: 'Test World' });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['npc-1', 'char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      useAlignedChoices: true,
    });

    expect(prompt).not.toMatch(/required alignment distribution|the distribution/i);
    expect(prompt).not.toContain(
      'Lawful/neutral/chaotic alignment should consider personality:'
    );
  });

  it('places personality context between skills and lore', () => {
    const world = createMockWorld({ id: 'world-1', name: 'Test World' });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['npc-1', 'char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      useAlignedChoices: false,
    });

    const skillsIndex = prompt.indexOf('CHARACTER SKILLS CONTEXT:');
    const personalityIndex = prompt.indexOf('CHARACTER PERSONALITY CONTEXT:');
    const loreIndex = prompt.indexOf('LORE_CONTEXT');

    expect(skillsIndex).toBeGreaterThan(-1);
    expect(personalityIndex).toBeGreaterThan(-1);
    expect(loreIndex).toBeGreaterThan(-1);
    expect(skillsIndex).toBeLessThan(personalityIndex);
    expect(personalityIndex).toBeLessThan(loreIndex);
  });

  it('skips personality context when no personality data is available', () => {
    const world = createMockWorld({ id: 'world-1', name: 'Test World' });

    const emptyPersonality = createStoreCharacter({
      id: 'char-1',
      isPlayer: true,
      background: {
        history: '',
        personality: '',
        goals: [],
        fears: [],
        relationships: [],
      },
    });

    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: {
        'char-1': emptyPersonality,
      },
    });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      useAlignedChoices: false,
    });

    expect(prompt).not.toContain('CHARACTER PERSONALITY CONTEXT:');
  });
});
