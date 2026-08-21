import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { useCharacterStore } from '@/state/characterStore';
import type { Character as StoreCharacter } from '@/state/characterStore';
import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';

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
    getState: jest.fn(),
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

const npc = (id: string, name: string): NPC =>
  ({
    id,
    name,
    worldId: 'world-1',
    description: 'Someone in the scene.',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  }) as NPC;

const seedNpcs = (npcs: NPC[]) => {
  (useNPCStore.getState as jest.Mock).mockReturnValue({
    getNPCsByWorld: jest.fn(() => npcs),
  });
};

const knownCharacterRoster = (prompt: string): string =>
  prompt.split('KNOWN CHARACTERS (use these exact names):')[1]?.split('\n\n')[0] ?? '';

describe('assembled aligned choice prompt', () => {
  beforeEach(() => {
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: { 'char-1': playerCharacter },
    });
    seedNpcs([]);
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

describe('the player character in their own choice prompt', () => {
  beforeEach(() => {
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: { 'char-1': playerCharacter },
    });
  });

  it('drops an NPC-store entry wearing the player name from the known-characters roster', () => {
    seedNpcs([npc('npc-thorn', 'Mayor Thorn'), npc('npc-stray', 'Player One')]);

    const roster = knownCharacterRoster(buildAlignedPrompt());

    expect(roster).toContain('Mayor Thorn');
    expect(roster).not.toContain('Player One');
  });

  it('drops the player even when the store entry differs only by spacing and case', () => {
    seedNpcs([npc('npc-thorn', 'Mayor Thorn'), npc('npc-stray', '  player  one ')]);

    expect(knownCharacterRoster(buildAlignedPrompt())).not.toMatch(/player\s+one/i);
  });

  it('tells the prompt who the protagonist is so options are their own actions', () => {
    seedNpcs([npc('npc-thorn', 'Mayor Thorn')]);

    const prompt = buildAlignedPrompt();

    expect(prompt).toContain('PROTAGONIST: The player is Player One.');
    expect(prompt).toMatch(/never the person an option targets/i);
  });

  it('still emits the roster when every NPC is a genuine third party', () => {
    seedNpcs([npc('npc-thorn', 'Mayor Thorn')]);

    expect(knownCharacterRoster(buildAlignedPrompt())).toContain('Mayor Thorn');
  });

  it('keeps a scene NPC that shares the character list with the player', () => {
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: {
        'char-1': playerCharacter,
        'npc-thorn': { ...playerCharacter, id: 'npc-thorn', name: 'Mayor Thorn', isPlayer: false },
      },
    });
    seedNpcs([npc('npc-thorn', 'Mayor Thorn')]);

    const roster = knownCharacterRoster(
      buildChoicePrompt({
        world: createMockWorld({ id: 'world-1', name: 'Test World' }),
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1', 'npc-thorn'],
        sessionId: 'session-1',
        includeDecisionHistory: false,
        useAlignedChoices: true,
      })
    );

    expect(roster).toContain('Mayor Thorn');
  });
});
