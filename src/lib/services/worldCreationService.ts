import { useWorldStore } from '@/state/worldStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { GeneratedWorldData } from '@/lib/generators/worldGenerator';
import { World, WorldAttribute, WorldSkill } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { worldApi, WorldImageParams } from '@/lib/api/worldApi';
import { normalizeText } from '@/lib/utils/textNormalization';

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

    // Prepare world data with customizations
    const worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
      name: customizations.name || generatedData.name,
      description: customizations.description || generatedData.description,
      genre: customizations.genre || generatedData.genre,
      attributes: [], // Will be populated below
      skills: [], // Will be populated below
      settings: generatedData.settings,
      toneSettings: DEFAULT_TONE_SETTINGS,
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
   * Create a world manually (without AI generation)
   */
  async createWorldManually(worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreateWorldResult> {
    const { createWorld } = useWorldStore.getState();

    // Ensure default values
    const completeWorldData = {
      ...worldData,
      attributes: worldData.attributes || [],
      skills: worldData.skills || [],
      settings: worldData.settings || {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40,
      },
      toneSettings: worldData.toneSettings || DEFAULT_TONE_SETTINGS,
    };

    const worldId = createWorld(completeWorldData);

    const { worlds } = useWorldStore.getState();
    const world = worlds[worldId];

    return {
      worldId,
      world,
    };
  },

  /**
   * Set a world as the current active world
   */
  setAsCurrentWorld(worldId: string): void {
    const { setCurrentWorld } = useWorldStore.getState();
    setCurrentWorld(worldId);
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
          generatedAt: new Date().toISOString(),
          prompt: imageData.prompt,
        },
      });
    } catch (error) {
      console.error('Failed to generate world image:', error);
      throw error;
    }
  },

  /**
   * Clone an existing world with modifications
   */
  async cloneWorld(
    sourceWorldId: string,
    modifications: {
      name: string;
      description?: string;
      genre?: string;
    }
  ): Promise<CreateWorldResult> {
    const { worlds } = useWorldStore.getState();
    const sourceWorld = worlds[sourceWorldId];

    if (!sourceWorld) {
      throw new Error('Source world not found');
    }

    // Create new world data based on source
    const newWorldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
      ...sourceWorld,
      name: modifications.name,
      description: modifications.description || sourceWorld.description,
      genre: modifications.genre || sourceWorld.genre,
      // Clone attributes and skills with new IDs
      attributes: sourceWorld.attributes.map(attr => ({
        ...attr,
        id: generateUniqueId('attribute'),
      })),
      skills: sourceWorld.skills.map(skill => ({
        ...skill,
        id: generateUniqueId('skill'),
      })),
    };

    return this.createWorldManually(newWorldData);
  },

  /**
   * Validate world data before creation
   */
  validateWorldData(worldData: Partial<World>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const normalizedName = normalizeText(worldData.name || '', {
      normalizeWhitespace: true,
      normalizeQuotes: true,
      normalizeSpecialChars: true,
      preserveStructure: false
    });
    if (!normalizedName) {
      errors.push('World name is required');
    }

    const normalizedGenre = normalizeText(worldData.genre || '', {
      normalizeWhitespace: true,
      normalizeQuotes: true,
      normalizeSpecialChars: true,
      preserveStructure: false
    });
    if (!normalizedGenre) {
      errors.push('Genre is required');
    }

    const normalizedDescription = normalizeText(worldData.description || '', {
      normalizeWhitespace: true,
      normalizeLineEndings: true,
      normalizeQuotes: true,
      normalizeSpecialChars: true,
      preserveStructure: true
    });
    if (!normalizedDescription) {
      errors.push('Description is required');
    }

    // Validate attributes
    if (worldData.attributes) {
      worldData.attributes.forEach((attr, index) => {
        const normalizedAttrName = normalizeText(attr.name || '', {
          normalizeWhitespace: true,
          normalizeQuotes: true,
          normalizeSpecialChars: true,
          preserveStructure: false
        });
        if (!normalizedAttrName) {
          errors.push(`Attribute ${index + 1} name is required`);
        }
      });
    }

    // Validate skills
    if (worldData.skills) {
      worldData.skills.forEach((skill, index) => {
        const normalizedSkillName = normalizeText(skill.name || '', {
          normalizeWhitespace: true,
          normalizeQuotes: true,
          normalizeSpecialChars: true,
          preserveStructure: false
        });
        if (!normalizedSkillName) {
          errors.push(`Skill ${index + 1} name is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Hook for easier integration with React components
 */
export function useWorldCreation() {
  return {
    createFromGeneration: worldCreationService.createWorldFromGeneration,
    createManually: worldCreationService.createWorldManually,
    setAsCurrent: worldCreationService.setAsCurrentWorld,
    generateImageBackground: worldCreationService.generateWorldImageBackground,
    cloneWorld: worldCreationService.cloneWorld,
    validateData: worldCreationService.validateWorldData,
  };
}