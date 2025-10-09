import { useWorldStore } from '@/state/worldStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { GeneratedWorldData } from '@/lib/generators/worldGenerator';
import { World, WorldAttribute, WorldSkill } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS, ToneSettings } from '@/types/tone-settings.types';
import { worldApi, WorldImageParams } from '@/lib/api/worldApi';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';
import { ToneSettingsGenerator, extractWorldAnalysisData } from '@/lib/ai/toneSettingsGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { logger } from '@/lib/utils/logger';

export interface CreateWorldFromGenerationParams {
  generatedData: GeneratedWorldData;
  customizations?: {
    name?: string;
    genre?: string;
    description?: string;
  };
  generateImage?: boolean;
}

export interface CreateWorldResult {
  worldId: string;
  world: World;
}

/**
 * Generate AI-powered tone settings for world data
 */
async function generateAIToneSettings(worldData: Partial<World>): Promise<ToneSettings> {
  try {
    const client = createDefaultGeminiClient();
    const generator = new ToneSettingsGenerator(client);
    const analysisData = extractWorldAnalysisData(worldData);

    const result = await generator.generateToneSettings(analysisData);

    logger.info('AI tone settings generated:', {
      contentRating: result.contentRating,
      narrativeStyle: result.narrativeStyle,
      languageComplexity: result.languageComplexity,
      reasoning: result.reasoning
    });

    return {
      contentRating: result.contentRating,
      narrativeStyle: result.narrativeStyle,
      languageComplexity: result.languageComplexity
    };
  } catch (error) {
    logger.warn('Failed to generate AI tone settings, using defaults:', error);
    return DEFAULT_TONE_SETTINGS;
  }
}

/**
 * Centralized service for world creation operations
 */
export const worldCreationService = {
  /**
   * Create a world from AI-generated data with proper ID assignment and store operations
   */
  async createWorldFromGeneration({
    generatedData,
    customizations = {},
    generateImage = true,
  }: CreateWorldFromGenerationParams): Promise<CreateWorldResult> {
    const { createWorld, updateWorld } = useWorldStore.getState();

    // Prepare initial world data with customizations
    const initialWorldData = {
      name: customizations.name || generatedData.name,
      description: customizations.description || generatedData.description,
      genre: customizations.genre || generatedData.genre,
      reference: generatedData.reference,
      relationship: generatedData.relationship,
    };

    // Generate AI-powered tone settings based on world data
    const aiToneSettings = await generateAIToneSettings(initialWorldData);

    // Prepare complete world data
    const worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
      ...initialWorldData,
      attributes: [], // Will be populated below
      skills: [], // Will be populated below
      settings: generatedData.settings,
      toneSettings: aiToneSettings,
    };

    // Create the world first
    const createdWorldId = createWorld(worldData);

    // Process attributes with proper IDs and worldId
    const processedAttributes: WorldAttribute[] = generatedData.attributes.map(attr => ({
      ...attr,
      id: generateUniqueId('attribute'),
      worldId: createdWorldId,
    }));

    // Process skills with proper IDs and worldId
    const processedSkills: WorldSkill[] = generatedData.skills.map(skill => ({
      ...skill,
      id: generateUniqueId('skill'),
      worldId: createdWorldId,
      attributeIds: [], // Will be linked based on skill requirements if needed
    }));

    // Update the world with processed attributes and skills
    updateWorld(createdWorldId, {
      attributes: processedAttributes,
      skills: processedSkills,
    });

    // Generate world image in the background if requested
    if (generateImage) {
      this.generateWorldImageBackground({
        id: createdWorldId,
        name: worldData.name,
        description: worldData.description,
        genre: worldData.genre,
      }).catch(error => {
        console.error('Background world image generation failed:', error);
        // Don't fail the world creation if image generation fails
      });
    }

    // Get the final world data
    const { worlds } = useWorldStore.getState();
    const finalWorld = worlds[createdWorldId];

    return {
      worldId: createdWorldId,
      world: finalWorld,
    };
  },

  

  

  /**
   * Generate world image in the background
   */
  async generateWorldImageBackground(world: {
    id: string;
    name: string;
    description: string;
    genre: string;
  }): Promise<void> {
    try {
      const imageParams: WorldImageParams = { world };
      const imageData = await worldApi.generateWorldImage(imageParams);

      // Update the world with the generated image
      const { updateWorld } = useWorldStore.getState();
      updateWorld(world.id, {
        image: {
          type: imageData.aiGenerated ? 'ai-generated' : 'placeholder',
          url: imageData.imageUrl,
          generatedAt: getTimestamp(),
          prompt: imageData.prompt,
        },
      });
    } catch (error) {
      console.error('Failed to generate world image:', error);
      throw error;
    }
  },

  
};

