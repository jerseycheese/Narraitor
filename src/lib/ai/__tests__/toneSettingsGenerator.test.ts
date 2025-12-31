import { ToneSettingsGenerator, extractWorldAnalysisData, WorldAnalysisData } from '../toneSettingsGenerator';
import { AIClient, AIResponse } from '../types';
import { World } from '@/types/world.types';

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

describe('ToneSettingsGenerator', () => {
  let mockClient: jest.Mocked<AIClient>;
  let generator: ToneSettingsGenerator;

  beforeEach(() => {
    mockClient = {
      generateContent: jest.fn(),
      generateImage: jest.fn()
    };
    generator = new ToneSettingsGenerator(mockClient);
  });

  describe('generateToneSettings', () => {
    const sampleWorldData: WorldAnalysisData = {
      name: 'Cyberpunk City',
      description: 'A dark future where technology and humanity collide in neon-lit streets',
      genre: 'science fiction',
      reference: 'Blade Runner',
      relationship: 'inspired_by'
    };

    it('should generate tone settings from valid AI response', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'R',
          narrativeStyle: 'dramatic',
          languageComplexity: 'advanced',
          reasoning: 'Cyberpunk themes require mature content handling with dramatic storytelling'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      const result = await generator.generateToneSettings(sampleWorldData);

      expect(result).toEqual({
        contentRating: 'R',
        narrativeStyle: 'dramatic',
        languageComplexity: 'advanced',
        reasoning: 'Cyberpunk themes require mature content handling with dramatic storytelling'
      });

      expect(mockClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Analyze this fictional world')
      );
    });

    it('should handle AI response with extra text around JSON', async () => {
      const mockResponse: AIResponse = {
        content: 'Here is my analysis:\n\n{"contentRating": "PG-13", "narrativeStyle": "action-packed", "languageComplexity": "moderate", "reasoning": "Fast-paced adventure story"}\n\nHope this helps!',
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      const result = await generator.generateToneSettings(sampleWorldData);

      expect(result.contentRating).toBe('PG-13');
      expect(result.narrativeStyle).toBe('action-packed');
      expect(result.languageComplexity).toBe('moderate');
    });

    it('should throw specific error for rate limiting', async () => {
      mockClient.generateContent.mockRejectedValueOnce(new Error('rate limit exceeded - 429'));

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('AI service is currently busy. Please try again in a moment.');
    });

    it('should throw specific error for network issues', async () => {
      mockClient.generateContent.mockRejectedValueOnce(new Error('network timeout occurred'));

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('Network error occurred. Please check your connection and try again.');
    });

    it('should throw specific error for parsing failures', async () => {
      const mockResponse: AIResponse = {
        content: 'This is not valid JSON at all',
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('AI response was invalid. Please try generating again.');
    });

    it('should throw error for empty AI response', async () => {
      const mockResponse: AIResponse = {
        content: '',
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('AI service returned empty response');
    });

    it('should throw error for invalid content rating', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'INVALID',
          narrativeStyle: 'dramatic',
          languageComplexity: 'advanced',
          reasoning: 'Test reasoning'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('Invalid content rating: INVALID');
    });

    it('should throw error for invalid narrative style', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'PG',
          narrativeStyle: 'invalid-style',
          languageComplexity: 'moderate',
          reasoning: 'Test reasoning'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('Invalid narrative style: invalid-style');
    });

    it('should throw error for missing reasoning', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'PG',
          narrativeStyle: 'balanced',
          languageComplexity: 'moderate'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await expect(generator.generateToneSettings(sampleWorldData))
        .rejects.toThrow('Missing or invalid reasoning in response');
    });

    it('should build proper analysis prompt with all world data', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'PG',
          narrativeStyle: 'balanced',
          languageComplexity: 'moderate',
          reasoning: 'Balanced approach works well'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      await generator.generateToneSettings(sampleWorldData);

      const calledPrompt = mockClient.generateContent.mock.calls[0][0];
      expect(calledPrompt).toContain('Name: Cyberpunk City');
      expect(calledPrompt).toContain('Genre: science fiction');
      expect(calledPrompt).toContain('Description: A dark future where technology');
      expect(calledPrompt).toContain('Reference Material: Blade Runner');
      expect(calledPrompt).toContain('Relationship to Reference: inspired_by');
    });

    it('should handle world data without reference material', async () => {
      const worldDataWithoutRef: WorldAnalysisData = {
        name: 'Fantasy Kingdom',
        description: 'A magical realm of knights and dragons',
        genre: 'fantasy'
      };

      const mockResponse: AIResponse = {
        content: JSON.stringify({
          contentRating: 'PG',
          narrativeStyle: 'epic',
          languageComplexity: 'moderate',
          reasoning: 'Epic fantasy adventure'
        }),
        finishReason: 'stop'
      };

      mockClient.generateContent.mockResolvedValueOnce(mockResponse);

      const result = await generator.generateToneSettings(worldDataWithoutRef);

      expect(result.narrativeStyle).toBe('epic');
      const calledPrompt = mockClient.generateContent.mock.calls[0][0];
      expect(calledPrompt).not.toContain('Reference Material:');
      expect(calledPrompt).not.toContain('Relationship to Reference:');
    });
  });
});

describe('extractWorldAnalysisData', () => {
  it('should extract analysis data from world object', () => {
    const world: Partial<World> = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world for analysis',
      genre: 'fantasy',
      reference: 'Lord of the Rings',
      relationship: 'inspired_by',
      attributes: [],
        skills: [],
    derivedStats: [],      settings: {
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 27,
        skillPointPool: 40
      }
    };

    const result = extractWorldAnalysisData(world);

    expect(result).toEqual({
      name: 'Test World',
      description: 'A test world for analysis',
      genre: 'fantasy',
      reference: 'Lord of the Rings',
      relationship: 'inspired_by'
    });
  });

  it('should throw error for missing required fields', () => {
    const incompleteWorld: Partial<World> = {
      name: 'Test World',
      // Missing description and genre
    };

    expect(() => extractWorldAnalysisData(incompleteWorld))
      .toThrow('World must have name, description, and genre for tone analysis');
  });

  it('should handle world without optional fields', () => {
    const minimalWorld: Partial<World> = {
      name: 'Simple World',
      description: 'A basic world',
      genre: 'adventure'
    };

    const result = extractWorldAnalysisData(minimalWorld);

    expect(result).toEqual({
      name: 'Simple World',
      description: 'A basic world',
      genre: 'adventure',
      reference: undefined,
      relationship: undefined
    });
  });
});