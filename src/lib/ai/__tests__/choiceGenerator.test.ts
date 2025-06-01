import { ChoiceGenerator } from '../choiceGenerator';
import { AIClient } from '../types';
import { EntityID } from '@/types/common.types';
import { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the worldStore
jest.mock('@/state/worldStore', () => ({
  worldStore: {
    getState: jest.fn().mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          name: 'Test World',
          description: 'A test world for unit tests',
          theme: 'fantasy'
        }
      },
      currentWorldId: 'world-1'
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return {
    recentSegments: [
      createSegment('segment-1', 'The hero enters the forest.'),
      createSegment('segment-2', 'A strange noise echoes through the trees.')
    ],
    currentLocation: 'Forest'
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
  });
});