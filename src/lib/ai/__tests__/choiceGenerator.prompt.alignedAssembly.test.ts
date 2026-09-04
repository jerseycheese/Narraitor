import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';
import { useLoreStore } from '@/state/loreStore';
import type { LoreFact } from '@/types/lore.types';

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

jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn().mockReturnValue({
      getFacts: jest.fn(() => []),
    }),
  },
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn().mockReturnValue({
      getWorldState: jest.fn(() => ({})),
    }),
  },
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: {
    getState: jest.fn().mockReturnValue({
      getSessionDecisions: jest.fn(() => []),
      getSessionSegments: jest.fn(() => []),
    }),
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
  status: { conditions: [] },
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

describe('settled commitments in aligned choices (#1963)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = originalEnv;
  });

  const seedFacts = (facts: Array<Partial<LoreFact>>) => {
    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getFacts: jest.fn(() => facts),
    });
  };

  it('omits the settled block when flag is disabled (default)', () => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = 'false';
    seedFacts([
      {
        id: 'e1',
        category: 'events',
        value: 'Davies delivered the parcel appraisal documents.',
        createdAt: '2025-01-01T00:00:00.000Z',
        metadata: {
          continuity: {
            kind: 'commitment',
            topic: 'parcel appraisal documents',
            speaker: 'Councilman Davies',
            status: 'delivered',
            fulfillment: { kind: 'durable' },
          },
        },
      },
    ]);

    const prompt = buildAlignedPrompt();
    expect(prompt).not.toContain('ALREADY SETTLED');
    expect(prompt).not.toContain('parcel appraisal documents');
  });

  it('renders delivered commitments and excludes outstanding commitments and continuity sections when flag is on', () => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = 'true';
    seedFacts([
      {
        id: 'e1',
        category: 'events',
        value: 'Davies handed over the parcel appraisal.',
        createdAt: '2025-01-01T00:00:00.000Z',
        metadata: {
          continuity: {
            kind: 'commitment',
            topic: 'parcel appraisal documents',
            speaker: 'Councilman Davies',
            status: 'delivered',
            fulfillment: { kind: 'durable' },
          },
        },
      },
      {
        id: 'e2',
        category: 'events',
        value: 'Thorn promised a public hearing.',
        createdAt: '2025-01-01T00:05:00.000Z',
        metadata: {
          continuity: {
            kind: 'commitment',
            topic: 'public hearing',
            speaker: 'Mayor Thorn',
            status: 'promised',
          },
        },
      },
      {
        id: 'e3',
        category: 'events',
        value: 'Aunt Carol says the debt was settled.',
        createdAt: '2025-01-01T00:10:00.000Z',
        metadata: {
          continuity: {
            kind: 'assertion',
            topic: 'mill debt',
            speaker: 'Aunt Carol',
          },
        },
      },
    ]);

    const prompt = buildAlignedPrompt();
    expect(prompt).toContain('ALREADY SETTLED (do not offer, request, negotiate, or obtain again):');
    expect(prompt).toContain('- parcel appraisal documents (delivered by Councilman Davies)');
    // Outstanding commitments and assertions must NOT appear in choices prompt
    expect(prompt).not.toContain('public hearing');
    expect(prompt).not.toContain('mill debt');
    expect(prompt).not.toContain('CONTINUITY REQUIREMENTS');
  });

  it('excludes lost possession and legacy unclassified commitments from choices prompt', () => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = 'true';
    seedFacts([
      {
        id: 'e1',
        category: 'events',
        value: 'Davies handed over the parcel appraisal.',
        createdAt: '2025-01-01T00:00:00.000Z',
        metadata: {
          continuity: {
            kind: 'commitment',
            topic: 'parcel appraisal documents',
            speaker: 'Councilman Davies',
            status: 'delivered',
            fulfillment: { kind: 'possession', itemId: 'doc-lost' },
          },
        },
      },
      {
        id: 'e2',
        category: 'events',
        value: 'Thorn handed over an unclassified letter.',
        createdAt: '2025-01-01T00:05:00.000Z',
        metadata: {
          continuity: {
            kind: 'commitment',
            topic: 'unclassified letter',
            speaker: 'Mayor Thorn',
            status: 'delivered',
            // Missing fulfillment
          },
        },
      },
    ]);

    const prompt = buildAlignedPrompt();
    expect(prompt).not.toContain('ALREADY SETTLED');
    expect(prompt).not.toContain('parcel appraisal documents');
    expect(prompt).not.toContain('unclassified letter');
  });

  it('fails open when store throws', () => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = 'true';
    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getFacts: jest.fn(() => {
        throw new Error('Store failure');
      }),
    });

    const prompt = buildAlignedPrompt();
    expect(prompt).not.toContain('ALREADY SETTLED');
  });

  it('caps at six commitments', () => {
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES = 'true';
    const facts: Array<Partial<LoreFact>> = Array.from({ length: 8 }, (_, i) => ({
      id: `e${i}`,
      category: 'events',
      value: `Actor ${i} handed over item ${i}.`,
      createdAt: `2025-01-01T00:0${i}:00.000Z`,
      metadata: {
        continuity: {
          kind: 'commitment',
          topic: `settled topic number ${i} with long description`,
          speaker: `Important Official Name ${i}`,
          status: 'delivered',
          fulfillment: { kind: 'durable' },
        },
      },
    }));
    seedFacts(facts);

    const prompt = buildAlignedPrompt();
    const settledSectionMatch = prompt.match(/ALREADY SETTLED[\s\S]*?(?=\n\n===|\n\n[A-Z]|$)/);
    expect(settledSectionMatch).not.toBeNull();
    const settledSection = settledSectionMatch![0];

    const lines = settledSection.split('\n').filter((l) => l.startsWith('- '));
    expect(lines.length).toBe(6);
  });
});
