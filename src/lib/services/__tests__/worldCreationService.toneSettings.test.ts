import { worldCreationService, useWorldCreation } from '../worldCreationService';
import { GeneratedWorldData } from '@/lib/generators/worldGenerator';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';

// Mock dependencies
jest.mock('@/state/worldStore');
jest.mock('@/lib/utils/generateId');
jest.mock('@/lib/ai/toneSettingsGenerator');
jest.mock('@/lib/ai/defaultGeminiClient');
jest.mock('@/lib/utils/logger');

// Import mocked modules
import { useWorldStore } from '@/state/worldStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { ToneSettingsGenerator } from '@/lib/ai/toneSettingsGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockGenerateUniqueId = generateUniqueId as jest.MockedFunction<typeof generateUniqueId>;
const mockToneSettingsGenerator = ToneSettingsGenerator as jest.MockedClass<typeof ToneSettingsGenerator>;
const mockCreateDefaultGeminiClient = createDefaultGeminiClient as jest.MockedFunction<typeof createDefaultGeminiClient>;

describe('worldCreationService - AI Tone Settings Integration', () => {
  let mockStore: any;
  let mockClient: any;
  let mockGenerator: jest.Mocked<ToneSettingsGenerator>;

  beforeEach(() => {
    // Setup mock store
    mockStore = {
      createWorld: jest.fn().mockReturnValue('world-123'),
      updateWorld: jest.fn(),
      worlds: {
        'world-123': {
          id: 'world-123',
          name: 'Test World',
          description: 'A test world',
          genre: 'fantasy',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 6,
            maxSkills: 10,
            attributePointPool: 27,
            skillPointPool: 40
          },
          toneSettings: {
            contentRating: 'PG',
            narrativeStyle: 'epic',
            languageComplexity: 'moderate'
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
    };

    mockUseWorldStore.mockReturnValue(mockStore);
    mockUseWorldStore.getState = jest.fn().mockReturnValue(mockStore);

    // Setup mock AI client and generator
    mockClient = { generateContent: jest.fn() };
    mockCreateDefaultGeminiClient.mockReturnValue(mockClient);

    mockGenerator = {
      generateToneSettings: jest.fn()
    } as any;
    mockToneSettingsGenerator.mockImplementation(() => mockGenerator);

    // Setup ID generation
    mockGenerateUniqueId
      .mockReturnValueOnce('world-123')
      .mockReturnValueOnce('attr-1')
      .mockReturnValueOnce('skill-1');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorldFromGeneration', () => {
    const sampleGeneratedData: GeneratedWorldData = {
      name: 'Cyberpunk Metropolis',
      description: 'A dark future city where technology dominates human life',
      genre: 'science fiction',
      reference: 'Blade Runner',
      relationship: 'inspired_by',
      attributes: [
        {
          name: 'Cybernetics',
          description: 'Integration with technology',
          baseValue: 1,
          minValue: 0,
          maxValue: 5
        }
      ],
      skills: [
        {
          name: 'Hacking',
          description: 'Computer infiltration abilities',
          category: 'Technical'
        }
      ],
      settings: {
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 27,
        skillPointPool: 40
      }
    };

    it('should generate AI tone settings based on world data', async () => {
      // Mock successful AI tone generation
      const mockToneSettings = {
        contentRating: 'R' as const,
        narrativeStyle: 'dramatic' as const,
        languageComplexity: 'advanced' as const,
        reasoning: 'Cyberpunk themes require mature content and dramatic storytelling'
      };

      mockGenerator.generateToneSettings.mockResolvedValueOnce(mockToneSettings);

      const result = await worldCreationService.createWorldFromGeneration({
        generatedData: sampleGeneratedData
      });

      // Verify AI tone generator was called with correct data
      expect(mockToneSettingsGenerator).toHaveBeenCalledWith(mockClient);
      expect(mockGenerator.generateToneSettings).toHaveBeenCalledWith({
        name: 'Cyberpunk Metropolis',
        description: 'A dark future city where technology dominates human life',
        genre: 'science fiction',
        reference: 'Blade Runner',
        relationship: 'inspired_by'
      });

      // Verify world was created with AI-generated tone settings
      expect(mockStore.createWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cyberpunk Metropolis',
          description: 'A dark future city where technology dominates human life',
          genre: 'science fiction',
          toneSettings: {
            contentRating: 'R',
            narrativeStyle: 'dramatic',
            languageComplexity: 'advanced'
          }
        })
      );

      expect(result.worldId).toBe('world-123');
    });

    it('should fall back to default tone settings if AI generation fails', async () => {
      // Mock AI tone generation failure
      mockGenerator.generateToneSettings.mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      const result = await worldCreationService.createWorldFromGeneration({
        generatedData: sampleGeneratedData
      });

      // Verify fallback to default settings
      expect(mockStore.createWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          toneSettings: DEFAULT_TONE_SETTINGS
        })
      );

      expect(result.worldId).toBe('world-123');
    });

    it('should use customizations and still generate AI tone settings', async () => {
      const customizations = {
        name: 'Custom Cyber City',
        description: 'My custom cyberpunk world',
        genre: 'dystopian'
      };

      const mockToneSettings = {
        contentRating: 'PG-13' as const,
        narrativeStyle: 'mysterious' as const,
        languageComplexity: 'moderate' as const,
        reasoning: 'Dystopian themes with mystery elements'
      };

      mockGenerator.generateToneSettings.mockResolvedValueOnce(mockToneSettings);

      await worldCreationService.createWorldFromGeneration({
        generatedData: sampleGeneratedData,
        customizations
      });

      // Verify AI was called with customized data
      expect(mockGenerator.generateToneSettings).toHaveBeenCalledWith({
        name: 'Custom Cyber City',
        description: 'My custom cyberpunk world',
        genre: 'dystopian',
        reference: 'Blade Runner',
        relationship: 'inspired_by'
      });

      // Verify world was created with customizations and AI tone settings
      expect(mockStore.createWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Cyber City',
          description: 'My custom cyberpunk world',
          genre: 'dystopian',
          toneSettings: {
            contentRating: 'PG-13',
            narrativeStyle: 'mysterious',
            languageComplexity: 'moderate'
          }
        })
      );
    });
  });

  describe('createWorldManually', () => {
    const manualWorldData = {
      name: 'Manual Fantasy World',
      description: 'A world created manually by the user',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 27,
        skillPointPool: 40
      }
    };

    it('should use default tone settings for manually created worlds', async () => {
      await worldCreationService.createWorldManually(manualWorldData);

      expect(mockGenerator.generateToneSettings).not.toHaveBeenCalled();

      expect(mockStore.createWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          toneSettings: DEFAULT_TONE_SETTINGS
        })
      );
    });

    it('should preserve existing tone settings when provided', async () => {
      const worldDataWithToneSettings = {
        ...manualWorldData,
        toneSettings: {
          contentRating: 'R' as const,
          narrativeStyle: 'serious' as const,
          languageComplexity: 'literary' as const
        }
      };

      await worldCreationService.createWorldManually(worldDataWithToneSettings);

      expect(mockGenerator.generateToneSettings).not.toHaveBeenCalled();

      expect(mockStore.createWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          toneSettings: {
            contentRating: 'R',
            narrativeStyle: 'serious',
            languageComplexity: 'literary'
          }
        })
      );
    });
  });

});