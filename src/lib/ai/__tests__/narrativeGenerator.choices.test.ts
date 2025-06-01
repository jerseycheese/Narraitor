import { NarrativeGenerator } from '../narrativeGenerator';
import { AIClient } from '../types';
import { ChoiceGenerator } from '../choiceGenerator';
import { NarrativeContext } from '@/types/narrative.types';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the ChoiceGenerator class
const mockGenerateChoices = jest.fn().mockResolvedValue({
  id: 'mock-decision',
  prompt: 'What will you do next?',
  options: [
    { id: 'option-1', text: 'Investigate the noise' },
    { id: 'option-2', text: 'Hide and wait' },
    { id: 'option-3', text: 'Run away' }
  ]
});

jest.mock('../choiceGenerator', () => {
  return {
    ChoiceGenerator: jest.fn().mockImplementation(() => {
      return {
        generateChoices: mockGenerateChoices
      };
    })
  };
});

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

describe('NarrativeGenerator - Player Choices', () => {
  let narrativeGenerator: NarrativeGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    narrativeGenerator = new NarrativeGenerator(mockAIClient);
  });

  describe('generatePlayerChoices', () => {
    it('should generate player choices successfully', async () => {
      // Create a mock narrative context
      const mockNarrativeContext: NarrativeContext = {
        recentSegments: [{
          id: 'segment-1',
          content: 'You are in a forest clearing.',
          type: 'scene',
          metadata: {
            tags: ['forest', 'fantasy']
          },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      };
      
      const result = await narrativeGenerator.generatePlayerChoices(
        'world-1',
        mockNarrativeContext,
        ['character-1']
      );
      
      // Check that the result matches the mock implementation
      expect(result).toBeDefined();
      expect(result.prompt).toBe('What will you do next?');
      expect(result.options).toHaveLength(3);
      expect(result.options[0].text).toBe('Investigate the noise');
      
      // Verify that the ChoiceGenerator was instantiated and used correctly
      expect(ChoiceGenerator).toHaveBeenCalledWith(mockAIClient);
      
      // Verify that generateChoices was called with the correct parameters
      expect(mockGenerateChoices).toHaveBeenCalledWith({
        worldId: 'world-1',
        narrativeContext: mockNarrativeContext,
        characterIds: ['character-1'],
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: true
      });
    });

    it('should handle errors and return fallback choices', async () => {
      // Mock ChoiceGenerator to throw an error
      mockGenerateChoices.mockRejectedValueOnce(new Error('Choice generation failed'));
      
      const mockNarrativeContext: NarrativeContext = {
        recentSegments: [{
          id: 'segment-1',
          content: 'You are in a forest clearing.',
          type: 'scene',
          metadata: {
            tags: ['forest', 'fantasy']
          },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      };
      
      // The generatePlayerChoices method should return fallback choices instead of throwing
      const result = await narrativeGenerator.generatePlayerChoices(
        'world-1',
        mockNarrativeContext,
        ['character-1']
      );
      
      // Should return fallback choices
      expect(result).toBeDefined();
      expect(result.prompt).toBe("What will you do next?");
      expect(result.options).toHaveLength(3);
      expect(result.options[0].text).toBe("Investigate further");
      expect(result.options[1].text).toBe("Talk to nearby characters");
      expect(result.options[2].text).toBe("Move to a new location");
      expect(result.id).toMatch(/^decision-fallback-\d+$/);
    });
  });
});