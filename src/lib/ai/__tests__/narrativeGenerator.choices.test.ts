import { NarrativeGenerator } from '../narrativeGenerator';
import { AIClient } from '../types';
import { NarrativeContext } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the generateChoices free function
const mockGenerateChoices = jest.fn().mockResolvedValue({
  id: 'mock-decision',
  prompt: 'What will you do next?',
  options: [
    { id: 'option-1', text: 'Investigate the noise' },
    { id: 'option-2', text: 'Hide and wait' },
    { id: 'option-3', text: 'Run away' }
  ]
});

jest.mock('../choiceGenerator', () => ({
  generateChoices: (...args: unknown[]) => mockGenerateChoices(...args)
}));

// Mock the worldStore
jest.mock('@/state/worldStore', () => ({
  worldStore: {
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
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: ['forest'],
        sessionId: 'session-1',
        recentSegments: [{
          id: 'segment-1',
          content: 'You are in a forest clearing.',
          type: 'scene',
          metadata: {
            tags: ['forest', 'fantasy']
          },
          timestamp: new Date(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp()
        }],
        currentLocation: 'Forest clearing'
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
      
      // Verify that generateChoices was called with the client and correct parameters
      expect(mockGenerateChoices).toHaveBeenCalledWith(mockAIClient, {
        worldId: 'world-1',
        narrativeContext: mockNarrativeContext,
        characterIds: ['character-1'],
        sessionId: 'session-1', // Now includes sessionId from narrativeContext
        minOptions: 3,
        maxOptions: 3,
        useAlignedChoices: true
      });
    });

    it('should handle errors and return fallback choices', async () => {
      // Mock ChoiceGenerator to throw an error
      mockGenerateChoices.mockRejectedValueOnce(new Error('Choice generation failed'));
      
      const mockNarrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: ['forest'],
        sessionId: 'session-1',
        recentSegments: [{
          id: 'segment-1',
          content: 'You are in a forest clearing.',
          type: 'scene',
          metadata: {
            tags: ['forest', 'fantasy']
          },
          timestamp: new Date(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp()
        }],
        currentLocation: 'Forest clearing'
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
      // The emergency fallback options are generic on purpose, so they carry no
      // skill check: a named check nothing in the option asked for is worse
      // than no roll at all.
      result.options.forEach((option) => {
        const skillRequirements =
          option.requirements?.filter((req) => req.type === 'skill') ?? [];
        expect(skillRequirements).toHaveLength(0);
      });
      expect(result.id).toMatch(/^decision-fallback-\d+$/);
    });
  });
});
