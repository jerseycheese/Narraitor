import { NarrativeGenerator } from '../narrativeGenerator';
import { GeminiClient } from '../geminiClient';
import { getNarrativeTemplate } from '../../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { getTimestamp } from '@/lib/utils/timestamp';
import { createMockWorldStore } from '@/lib/test-utils';
import type { World } from '@/types/world.types';

jest.mock('../geminiClient');
jest.mock('../../promptTemplates/narrativeTemplateManager');
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn(),
  },
}));

const mockWorld = {
  id: 'world-123',
  name: 'Mystical Forest',
  description: 'A dark, enchanted forest full of ancient magic',
  genre: 'fantasy',
  attributes: [
    {
      id: 'attr-1',
      name: 'Magic',
      description: 'Magical power',
      worldId: 'world-123',
      baseValue: 5,
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'attr-2',
      name: 'Danger',
      description: 'Danger level',
      worldId: 'world-123',
      baseValue: 3,
      minValue: 0,
      maxValue: 10,
    },
  ],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
} satisfies World;

describe('NarrativeGenerator', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocked client
    mockGeminiClient = {
      generateContent: jest.fn(),
    } as unknown as jest.Mocked<GeminiClient>;

    narrativeGenerator = new NarrativeGenerator(mockGeminiClient);

    // Mock prompt template
    const mockTemplate = jest.fn().mockReturnValue('Generated prompt');
    (getNarrativeTemplate as jest.Mock).mockReturnValue(
      mockTemplate
    );

    // Mock world store
    (useWorldStore.getState as jest.Mock).mockReturnValue(
      createMockWorldStore({
        worlds: { 'world-123': mockWorld },
        currentWorldId: 'world-123',
      })
    );
  });

  describe('generateSegment', () => {
    it('generates a narrative segment with appropriate world context', async () => {
      const mockAIResponse = {
        content:
          'The ancient trees stand tall in the moonlight, their branches swaying gently in the breeze.',
        finishReason: 'stop',
        promptTokens: 50,
        completionTokens: 30,
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        generationParameters: {
          desiredLength: 'medium' as const,
        },
      };

      const result = await narrativeGenerator.generateSegment(request);

      expect(result.content).toBe(mockAIResponse.content);
      // Segment type is inferred from content - this should be 'scene' (descriptive content)
      expect(result.segmentType).toBe('scene');
      expect(result.metadata.mood).toBe('mysterious');
      expect(getNarrativeTemplate).toHaveBeenCalledWith(
        'narrative/scene'
      );
    });

    it('includes narrative context when provided', async () => {
      const mockAIResponse = {
        content: JSON.stringify({
          content:
            'Hours pass as you travel deeper into the forest, the path becoming narrower with each step.',
          type: 'transition',
          metadata: {
            mood: 'neutral',
            tags: ['travel', 'time-passage'],
          },
        }),
        finishReason: 'stop',
        promptTokens: 45,
        completionTokens: 25,
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        narrativeContext: {
          worldId: 'world-123',
          currentSceneId: 'scene-1',
          characterIds: ['char-1'],
          sessionId: 'session-123',
          previousSegments: [],
          currentTags: [],
          recentSegments: [
            {
              id: 'seg-1',
              content: 'Previous narrative content...',
              type: 'scene' as const,
              metadata: {
                mood: 'mysterious' as const,
                location: 'Forest Entrance',
                tags: ['forest', 'mysterious'],
              },
              timestamp: new Date(),
              createdAt: getTimestamp(),
              updatedAt: getTimestamp(),
            },
          ],
          currentLocation: 'Forest Entrance',
        },
      };

      const result = await narrativeGenerator.generateSegment(request);

      expect(result.content).toContain('Hours pass');
      // Segment type comes from AI's JSON response
      expect(result.segmentType).toBe('transition');
    });

    it('keeps a requested transition as a scene boundary when the model labels it scene', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          content: 'Three days later, the council gathers for the vote.',
          type: 'scene',
          metadata: { mood: 'tense', tags: ['council'] },
        }),
        finishReason: 'stop',
      });

      const result = await narrativeGenerator.generateSegment({
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        generationParameters: { segmentType: 'transition' },
      });

      expect(result.segmentType).toBe('transition');
      expect(result.metadata.tags).toContain('transition');
    });

    it('handles errors gracefully', async () => {
      mockGeminiClient.generateContent.mockRejectedValue(
        new Error('API Error')
      );

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
      };

      await expect(narrativeGenerator.generateSegment(request)).rejects.toThrow(
        'Failed to generate narrative segment'
      );
    });

    it('uses AI-provided dialogue type from JSON response', async () => {
      const mockAIResponse = {
        content: JSON.stringify({
          content:
            '"Welcome, traveler," the innkeeper says with a warm smile. "What brings you to our village?"',
          type: 'dialogue',
          metadata: {
            mood: 'neutral',
            tags: ['conversation'],
          },
        }),
        finishReason: 'stop',
        promptTokens: 50,
        completionTokens: 30,
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        generationParameters: {
          desiredLength: 'short' as const,
        },
      };

      const result = await narrativeGenerator.generateSegment(request);

      expect(result.content).toContain('Welcome, traveler');
      // Segment type comes from AI's JSON response
      expect(result.segmentType).toBe('dialogue');
    });

    it('uses AI-provided action type from JSON response', async () => {
      const mockAIResponse = {
        content: JSON.stringify({
          content:
            'You swing your sword in a wide arc, striking the bandit. He dodges backward, barely avoiding the blade.',
          type: 'action',
          metadata: {
            mood: 'action',
            tags: ['combat'],
          },
        }),
        finishReason: 'stop',
        promptTokens: 50,
        completionTokens: 30,
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const request = {
        worldId: 'world-123',
        sessionId: 'session-123',
        characterIds: ['char-1'],
        generationParameters: {
          desiredLength: 'short' as const,
        },
      };

      const result = await narrativeGenerator.generateSegment(request);

      expect(result.content).toContain('swing your sword');
      // Segment type comes from AI's JSON response
      expect(result.segmentType).toBe('action');
    });
  });

  describe('generateInitialScene', () => {
    it('generates an appropriate opening scene for the world', async () => {
      const mockAIResponse = {
        content: 'You awaken in the heart of the Mystical Forest...',
        finishReason: 'stop',
        promptTokens: 40,
        completionTokens: 35,
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await narrativeGenerator.generateInitialScene(
        'world-123',
        ['char-1']
      );

      expect(result.content).toContain('Mystical Forest');
      expect(result.segmentType).toBe('scene');
      expect(getNarrativeTemplate).toHaveBeenCalledWith(
        'narrative/initialScene'
      );
    });
  });
});
