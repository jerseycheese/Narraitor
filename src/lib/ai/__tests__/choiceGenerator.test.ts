import { generateChoices } from '../choiceGenerator';
import { AIClient } from '../types';
import { EntityID } from '@/types/common.types';
import { DecisionOption, NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the worldStore
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn().mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          name: 'Test World',
          description: 'A test world for unit tests',
          genre: 'fantasy'
        }
      },
      currentWorldId: 'world-1'
    })
  }
}));

// Mock the inventory store to avoid persistence during tests
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: () => []
    })
  }
}));

// Mock narrativeTemplateManager
jest.mock('@/lib/promptTemplates/narrativeTemplateManager', () => ({
  getNarrativeTemplate: jest.fn().mockImplementation((templateKey) => {
    if (templateKey === 'narrative/playerChoice') {
      return jest.fn().mockReturnValue('Generate player choices for this scenario');
    }
    return jest.fn();
  })
}));

// Mock providerStore for the debugInfo test below (getActiveProviderModel)
jest.mock('@/state/providerStore', () => ({
  getActiveProviderModel: jest.fn().mockReturnValue('test-model'),
}));

// Generate simple mock narrative context
const createMockNarrativeContext = (): NarrativeContext => {
  const createSegment = (id: string, content: string): NarrativeSegment => ({
    id: id as EntityID,
    worldId: 'world-1',
    sessionId: 'session-1',
    content,
    type: 'scene',
    metadata: {
      tags: ['fantasy']
    },
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  });

  return {
    worldId: 'world-1',
    currentSceneId: 'scene-1',
    characterIds: ['char-1'],
    previousSegments: [],
    currentTags: [],
    sessionId: 'session-1',
    recentSegments: [
      createSegment('segment-1', 'The hero enters the forest.'),
      createSegment('segment-2', 'A strange noise echoes through the trees.')
    ],
    currentLocation: 'Forest',
    currentSituation: 'Exploring the forest'
  };
};

describe('ChoiceGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChoices', () => {
    it('should generate player choices successfully', async () => {
      // Mock the AI response
      const mockResponse = {
        content: `Decision: What will you do in the forest?
        
        Options:
        1. Investigate the strange noise
        2. Climb a tree to get a better view
        3. Draw your sword and prepare for combat`,
        finishReason: 'STOP'
      };
      
      mockAIClient.generateContent.mockResolvedValueOnce(mockResponse);
      
      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });
      
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.prompt).toBe('What will you do in the forest?');
      expect(result.options).toHaveLength(3);
      expect(result.options[0].text).toBe('Investigate the strange noise');
      expect(result.options[1].text).toBe('Climb a tree to get a better view');
      expect(result.options[2].text).toBe('Draw your sword and prepare for combat');
    });

    it('keeps three options by default when the model returns more', async () => {
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do in the forest?

        Options:
        1. Investigate the strange noise
        2. Climb a tree to get a better view
        3. Draw your sword and prepare for combat
        4. Set the underbrush alight`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options).toHaveLength(3);
    });

    it('attaches debugInfo with the sent prompt and the raw response when debug info is enabled (#1829 round 6)', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });

      try {
        const rawResponse = `Alignment Mix: NEUTRAL, CHAOTIC, LAWFUL - a quiet moment before the plan
        Decision: What will you do in the forest?

        Options:
        1. [NEUTRAL] Investigate the strange noise
        2. [CHAOTIC] Climb a tree to get a better view
        3. [LAWFUL] Draw your sword and prepare for combat`;

        mockAIClient.generateContent.mockResolvedValueOnce({
          content: rawResponse,
          finishReason: 'STOP',
        });

        const result = await generateChoices(mockAIClient, {
          worldId: 'world-1',
          narrativeContext: createMockNarrativeContext(),
          characterIds: ['char-1'],
        });

        expect(result.debugInfo).toBeDefined();
        expect(result.debugInfo?.fullPrompt).toContain('Generate player choices for this scenario');
        expect(result.debugInfo?.rawResponse).toBe(rawResponse);
        expect(result.debugInfo?.modelUsed).toBe('test-model');
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: originalNodeEnv,
          writable: true,
          configurable: true,
        });
      }
    });

    it('falls back to exactly three options so nothing generated goes unshown', async () => {
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: '',
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options).toHaveLength(3);
    });

    it('should handle AI errors and generate fallback choices', async () => {
      mockAIClient.generateContent.mockRejectedValueOnce(new Error('AI Service unavailable'));

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });
      
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.prompt).toBeTruthy();
    });
    
    it('prefers the explicit generateChoices entry point when the client has one', async () => {
      const routingClient: jest.Mocked<AIClient> = {
        generateContent: jest.fn(),
        generateChoices: jest.fn().mockResolvedValueOnce({ content: '', finishReason: 'STOP' }),
      };

      await generateChoices(routingClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });

      expect(routingClient.generateChoices).toHaveBeenCalled();
      expect(routingClient.generateContent).not.toHaveBeenCalled();
    });

    it('should handle empty or malformed AI responses', async () => {
      // Mock an empty response
      mockAIClient.generateContent.mockResolvedValueOnce({ content: '', finishReason: 'STOP' });
      
      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });
      
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.prompt).toBeTruthy();
    });

    // Skills in a fixed order, so an option-index assignment would be visible:
    // index 0 is Stealth, index 1 is Arcana.
    const mockWorldWithSkills = () => {
      const { useWorldStore } = require('@/state/worldStore');
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': {
            id: 'world-1',
            name: 'Test World',
            description: 'A test world for unit tests',
            genre: 'fantasy',
            attributes: [],
            settings: {
              maxAttributes: 6,
              maxSkills: 12,
              attributePointPool: 27,
              skillPointPool: 40,
            },
            skills: [
              {
                id: 'skill-stealth',
                worldId: 'world-1',
                name: 'Stealth',
                description: 'Move unseen',
                difficulty: 'medium',
                baseValue: 3,
                minValue: 1,
                maxValue: 10,
              },
              {
                id: 'skill-arcana',
                worldId: 'world-1',
                name: 'Arcana',
                description: 'Reading runes and warding sigils',
                difficulty: 'hard',
                baseValue: 3,
                minValue: 1,
                maxValue: 10,
              },
            ],
          },
        },
        currentWorldId: 'world-1',
      });
    };

    const skillRequirementsOf = (option: DecisionOption) =>
      option.requirements?.filter((req) => req.type === 'skill') ?? [];

    it('leaves an option unchecked when nothing in it points at a skill', async () => {
      mockWorldWithSkills();

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?

Options:
1. Follow the river north
2. Wait for dawn
3. Knock on the heavy door`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options.length).toBe(3);
      result.options.forEach((option) => {
        expect(skillRequirementsOf(option)).toHaveLength(0);
      });
    });

    it('checks the skill an option names, wherever that option sits in the list', async () => {
      mockWorldWithSkills();

      // Stealth is skills[0] and this is options[1], so a positional
      // assignment would resolve it against Arcana instead.
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?

Options:
1. Wait for dawn
2. Cross the courtyard on Stealth alone
3. Knock on the heavy door`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(skillRequirementsOf(result.options[1])[0]?.targetId).toBe('skill-stealth');
      expect(skillRequirementsOf(result.options[0])).toHaveLength(0);
      expect(skillRequirementsOf(result.options[2])).toHaveLength(0);
    });

    it('checks a short skill name the option says outright, but not inside a longer word', async () => {
      const { useWorldStore } = require('@/state/worldStore');
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': {
            id: 'world-1',
            name: 'Test World',
            description: 'A test world for unit tests',
            genre: 'fantasy',
            attributes: [],
            settings: {
              maxAttributes: 6,
              maxSkills: 12,
              attributePointPool: 27,
              skillPointPool: 40,
            },
            skills: [
              {
                id: 'skill-chi',
                worldId: 'world-1',
                name: 'Chi',
                description: 'Inner force',
                difficulty: 'medium',
                baseValue: 3,
                minValue: 1,
                maxValue: 10,
              },
            ],
          },
        },
        currentWorldId: 'world-1',
      });

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?

Options:
1. Gather your Chi before the next blow
2. Wait for dawn
3. File a formal chinstrap complaint`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(skillRequirementsOf(result.options[0])[0]?.targetId).toBe('skill-chi');
      expect(skillRequirementsOf(result.options[1])).toHaveLength(0);
      expect(skillRequirementsOf(result.options[2])).toHaveLength(0);
    });

    it('matches on a skill description when the option never says the name', async () => {
      mockWorldWithSkills();

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?

Options:
1. Wait for dawn
2. Follow the river north
3. Study the runes and sigils above the door`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(skillRequirementsOf(result.options[2])[0]?.targetId).toBe('skill-arcana');
    });

    it('drops a skill requirement this world cannot resolve', async () => {
      mockWorldWithSkills();

      // Empty content routes through generateFallbackChoices, whose genre
      // options carry hardcoded skill ids no generated world has.
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: '',
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      const worldSkillIds = ['skill-stealth', 'skill-arcana'];
      result.options.forEach((option) => {
        skillRequirementsOf(option).forEach((requirement) => {
          expect(worldSkillIds).toContain(requirement.targetId);
        });
      });
    });

    it('assigns no check at all when the world has no skills', async () => {
      const { useWorldStore } = require('@/state/worldStore');
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': {
            id: 'world-1',
            name: 'Test World',
            description: 'A test world for unit tests',
            genre: 'fantasy',
            attributes: [],
            settings: {
              maxAttributes: 6,
              maxSkills: 12,
              attributePointPool: 27,
              skillPointPool: 40,
            },
            skills: [],
          },
        },
        currentWorldId: 'world-1',
      });

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?

Options:
1. Move quietly through the trees
2. Search the nearby ruins
3. Signal your allies from cover`,
        finishReason: 'STOP',
      });

      const result = await generateChoices(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options.length).toBe(3);
      result.options.forEach((option) => {
        expect(skillRequirementsOf(option)).toHaveLength(0);
      });
    });
  });
});

// NPC roster for consequence-target resolution (hoisted by jest)
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn().mockReturnValue({
      getNPCsByWorld: () => [{ id: 'npc-1', name: 'Marta', worldId: 'world-1' }],
    }),
  },
}));

describe('generateChoices structured consequences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carries parsed trust deltas and composed alignment shifts on options', async () => {
    mockAIClient.generateContent.mockResolvedValue({
      content: `Decision Weight: [major]
Decision: What do you do?

1. [Lawful] Return the ledger to Marta
   Consequences: Marta trust +10
2. [Neutral] Ask around quietly
3. [Chaotic] Torch the ledger in the square
   Consequences: Marta trust -15`,
      finishReason: 'stop',
    });

    const decision = await generateChoices(mockAIClient, {
      worldId: 'world-1',
      narrativeContext: createMockNarrativeContext(),
      characterIds: ['char-1'],
    });

    const lawful = decision.options.find((o) => o.alignment === 'lawful');
    expect(lawful?.consequences).toEqual(
      expect.arrayContaining([
        { type: 'relationship', action: 'modify', targetId: 'npc-1', value: { trustDelta: 10 } },
        { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 8 },
      ])
    );

    const chaotic = decision.options.find((o) => o.alignment === 'chaotic');
    expect(chaotic?.consequences).toEqual(
      expect.arrayContaining([
        { type: 'relationship', action: 'modify', targetId: 'npc-1', value: { trustDelta: -15 } },
        { type: 'alignment', action: 'add', targetId: 'player-alignment', value: -8 },
      ])
    );

    const neutral = decision.options.find((o) => o.alignment === 'neutral');
    expect(neutral?.consequences ?? []).toHaveLength(0);
  });

  it('composes alignment consequences on the fallback path too', async () => {
    mockAIClient.generateContent.mockRejectedValue(new Error('AI down'));

    const decision = await generateChoices(mockAIClient, {
      worldId: 'world-1',
      narrativeContext: createMockNarrativeContext(),
      characterIds: ['char-1'],
    });

    const aligned = decision.options.filter(
      (o) => o.alignment === 'lawful' || o.alignment === 'chaotic'
    );
    expect(aligned.length).toBeGreaterThan(0);
    for (const option of aligned) {
      expect(option.consequences).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'alignment', targetId: 'player-alignment' }),
        ])
      );
    }
  });
});
