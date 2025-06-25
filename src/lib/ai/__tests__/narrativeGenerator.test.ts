import { NarrativeGenerator } from '../narrativeGenerator';
import { GeminiClient } from '../geminiClient';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';

jest.mock('../geminiClient');
jest.mock('../../promptTemplates/narrativeTemplateManager');
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn()
  }
}));

const mockWorld = {
  id: 'world-123',
  name: 'Mystical Forest',
  description: 'A dark, enchanted forest full of ancient magic',
  genre: 'fantasy',
  attributes: [
    { id: 'attr-1', name: 'Magic', description: 'Magical power', worldId: 'world-123', baseValue: 5, minValue: 0, maxValue: 10 },
    { id: 'attr-2', name: 'Danger', description: 'Danger level', worldId: 'world-123', baseValue: 3, minValue: 0, maxValue: 10 }
  ],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 20
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

describe('NarrativeGenerator', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocked client
    mockGeminiClient = {
      generateContent: jest.fn()
    } as unknown as jest.Mocked<GeminiClient>;
    
    narrativeGenerator = new NarrativeGenerator(mockGeminiClient);

    // Mock prompt template
    const mockTemplate = jest.fn().mockReturnValue('Generated prompt');
    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(mockTemplate);
    
    // Mock world store
    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: { 'world-123': mockWorld },
      currentWorldId: 'world-123'
    });
  });

  describe('generateSegment', () => {
    it('generates a narrative segment with appropriate world context', async () => {
      const mockAIResponse = {
        content: 'The ancient trees whispered secrets in the moonlight...',
        type: 'scene',
        metadata: { mood: 'mysterious', location: 'Deep Forest' }
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        generationParameters: {
          desiredLength: 'medium' as const,
          segmentType: 'scene' as const
        }
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test actual functionality - response formatting and metadata handling
      expect(result.content).toBe(mockAIResponse.content);
      expect(result.segmentType).toBe('scene');
      expect(result.metadata).toEqual({
        characterIds: [],
        location: 'Enchanted Forest', // Default for fantasy genre
        mood: 'mysterious',
        tags: ['fantasy', 'narrative']
      });
      expect(result.tokenUsage).toBeUndefined(); // No token usage in mock response
    });

    it('includes narrative context when provided', async () => {
      const mockAIResponse = {
        content: 'Continuing deeper into the forest...'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        narrativeContext: {
          recentSegments: [
            {
              id: 'seg-1',
              content: 'Previous narrative content...',
              type: 'scene'
            }
          ],
          currentLocation: 'Forest Entrance'
        },
        generationParameters: {
          segmentType: 'transition' as const
        }
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test narrative context handling functionality
      expect(result.content).toBe(mockAIResponse.content);
      expect(result.segmentType).toBe('transition');
      expect(result.metadata).toEqual({
        characterIds: [],
        location: 'Enchanted Forest', // Default fallback for fantasy
        mood: 'mysterious', // Default fallback for fantasy
        tags: ['fantasy', 'narrative']
      });
    });

    it('handles JSON response parsing correctly', async () => {
      const mockAIResponse = {
        content: JSON.stringify({
          content: 'The forest comes alive with whispers...',
          metadata: {
            location: 'Dark Grove',
            mood: 'tense',
            tags: ['supernatural', 'encounter']
          }
        })
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1']
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test JSON parsing functionality
      expect(result.content).toBe('The forest comes alive with whispers...');
      expect(result.metadata.location).toBe('Dark Grove');
      expect(result.metadata.mood).toBe('tense');
      expect(result.metadata.tags).toEqual(['supernatural', 'encounter']);
    });

    it('handles malformed JSON with fallbacks', async () => {
      const mockAIResponse = {
        content: 'This is just plain text without any JSON structure'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1']
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test fallback functionality when JSON parsing fails
      expect(result.content).toBe('This is just plain text without any JSON structure');
      expect(result.metadata.location).toBe('Enchanted Forest'); // Default for fantasy
      expect(result.metadata.mood).toBe('mysterious'); // Default for fantasy
      expect(result.metadata.tags).toEqual(['fantasy', 'narrative']);
    });

    it('handles API errors gracefully', async () => {
      mockGeminiClient.generateContent.mockRejectedValue(new Error('API Error'));

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1']
      };

      await expect(narrativeGenerator.generateSegment(request)).rejects.toThrow('Failed to generate narrative segment');
    });
  });

  describe('generateInitialScene', () => {
    it('generates an appropriate opening scene for the world', async () => {
      const mockAIResponse = {
        content: 'You awaken in the heart of the Mystical Forest...'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await narrativeGenerator.generateInitialScene('world-123', ['char-1']);

      // Test initial scene generation functionality
      expect(result.content).toBe(mockAIResponse.content);
      expect(result.segmentType).toBe('scene');
      expect(result.metadata).toEqual({
        characterIds: [],
        location: 'Enchanted Forest', // Default fallback for fantasy
        mood: 'mysterious', // Default fallback for fantasy
        tags: ['fantasy', 'narrative']
      });
    });
  });

  describe('genre-based fallbacks', () => {
    it('applies correct mood and location for horror genre', async () => {
      const horrorWorld = {
        ...mockWorld,
        genre: 'horror'
      };
      
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: { 'world-123': horrorWorld },
        currentWorldId: 'world-123'
      });

      const mockAIResponse = {
        content: 'The darkness creeps closer...'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1']
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test genre-specific fallback functionality
      expect(result.metadata.mood).toBe('tense'); // Horror default
      expect(result.metadata.location).toBe('Abandoned Mansion'); // Horror default
      expect(result.metadata.tags).toEqual(['horror', 'narrative']);
    });

    it('applies correct mood and location for sci-fi genre', async () => {
      const scifiWorld = {
        ...mockWorld,
        genre: 'sci-fi'
      };
      
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: { 'world-123': scifiWorld },
        currentWorldId: 'world-123'
      });

      const mockAIResponse = {
        content: 'The stars illuminate the vast emptiness of space...'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1']
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Test sci-fi genre fallback functionality
      expect(result.metadata.mood).toBe('mysterious'); // Sci-fi default
      expect(result.metadata.location).toBe('Space Station'); // Sci-fi default
      expect(result.metadata.tags).toEqual(['sci-fi', 'narrative']);
    });
  });
});
