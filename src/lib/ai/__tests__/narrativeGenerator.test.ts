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
  theme: 'fantasy',
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

      expect(result.content).toBe(mockAIResponse.content);
      expect(result.segmentType).toBe('scene');
      expect(result.metadata.mood).toBe('mysterious');
      expect(narrativeTemplateManager.getTemplate).toHaveBeenCalledWith('narrative/scene');
    });

    it('includes narrative context when provided', async () => {
      const mockAIResponse = {
        content: 'Continuing deeper into the forest...',
        type: 'transition', 
        metadata: { mood: 'tense' }
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

      expect(result.content).toBe(mockAIResponse.content);
      expect(result.segmentType).toBe('transition');
    });

    it('handles errors gracefully', async () => {
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
        content: 'You awaken in the heart of the Mystical Forest...',
        type: 'scene',
        metadata: { mood: 'mysterious', location: 'Forest Heart' }
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await narrativeGenerator.generateInitialScene('world-123', ['char-1']);

      expect(result.content).toContain('Mystical Forest');
      expect(result.segmentType).toBe('scene');
      expect(narrativeTemplateManager.getTemplate).toHaveBeenCalledWith('narrative/initialScene');
    });
  });
});
