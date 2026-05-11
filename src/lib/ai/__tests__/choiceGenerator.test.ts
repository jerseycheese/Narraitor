import { ChoiceGenerator } from '../choiceGenerator';
import { AIClient } from '../types';
import { EntityID } from '@/types/common.types';
import { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
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
  narrativeTemplateManager: {
    getTemplate: jest.fn().mockImplementation((templateKey) => {
      if (templateKey === 'narrative/playerChoice') {
        return jest.fn().mockReturnValue('Generate player choices for this scenario');
      }
      return jest.fn();
    })
  }
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
  let choiceGenerator: ChoiceGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    choiceGenerator = new ChoiceGenerator(mockAIClient);
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
      
      const result = await choiceGenerator.generateChoices({
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

    it('should handle AI errors and generate fallback choices', async () => {
      mockAIClient.generateContent.mockRejectedValueOnce(new Error('AI Service unavailable'));
      
      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });
      
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.prompt).toBeTruthy();
    });
    
    it('should handle empty or malformed AI responses', async () => {
      // Mock an empty response
      mockAIClient.generateContent.mockResolvedValueOnce({ content: '', finishReason: 'STOP' });
      
      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1']
      });
      
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.prompt).toBeTruthy();
    });

    it('ensures every returned option has a skill requirement', async () => {
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
                id: 'skill-magic',
                worldId: 'world-1',
                name: 'Magic',
                description: 'Arcane knowledge',
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

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: `Decision: What will you do?
        
Options:
1. Move quietly through the trees
2. Search the nearby ruins
3. Signal your allies from cover`,
        finishReason: 'STOP',
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options.length).toBe(3);
      result.options.forEach((option) => {
        const skillRequirements =
          option.requirements?.filter((req) => req.type === 'skill') ?? [];
        expect(skillRequirements.length).toBeGreaterThan(0);
      });
    });

    it('ensures every returned option has a skill requirement when world has no skills', async () => {
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

      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options.length).toBe(3);
      result.options.forEach((option) => {
        const skillRequirements =
          option.requirements?.filter((req) => req.type === 'skill') ?? [];
        expect(skillRequirements.length).toBeGreaterThan(0);
      });
    });

    it('replaces invalid AI skill requirements with deterministic world skill fallbacks', async () => {
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
                id: 'skill-hacking',
                worldId: 'world-1',
                name: 'Hacking',
                description: 'Manipulate digital systems',
                difficulty: 'medium',
                baseValue: 3,
                minValue: 1,
                maxValue: 10,
              },
              {
                id: 'skill-systems',
                worldId: 'world-1',
                name: 'Systems',
                description: 'Understand infrastructure',
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
1. [Neutral] Talk your way past the gate
Requirements: Persuasion 5+
2. [Neutral] Override the security terminal
Requirements: Systems 3+
3. [Chaotic] Trigger a false alarm
Requirements: skill-from-other-world 4+`,
        finishReason: 'STOP',
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext: createMockNarrativeContext(),
        characterIds: ['char-1'],
      });

      expect(result.options[0].requirements?.[0].targetId).toBe('skill-hacking');
      expect(result.options[1].requirements?.[0].targetId).toBe('skill-systems');
      expect(result.options[2].requirements?.[0].targetId).toBe('skill-hacking');
    });
  });
});
