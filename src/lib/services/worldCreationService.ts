import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp, safeTrim } from '@/lib/utils';
import { GeneratedWorldData } from '@/lib/generators/worldGenerator';
import { World, WorldAttribute, WorldSkill } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS, ToneSettings } from '@/types/tone-settings.types';
import { worldApi, WorldImageParams } from '@/lib/api/worldApi';
import { generateToneSettings, extractWorldAnalysisData } from '@/lib/ai/toneSettingsGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { logger } from '@/lib/utils/logger';
import { npcPortraitService } from './npcPortraitService';
import { toGenreValue } from '@/lib/constants/genres';
import type { GenreValue } from '@/types/genre.types';

export interface CreateWorldFromGenerationParams {
  generatedData: GeneratedWorldData;
  customizations?: {
    name?: string;
    genre?: GenreValue;
    description?: string;
  };
  generateImage?: boolean;
}

export interface CreateWorldResult {
  worldId: string;
  world: World;
}

interface GeneratedNPCResult {
  id: string;
  name: string;
  description: string;
  avatarPrompt?: string;
}

const slugify = (value: string): string => {
  const normalized = safeTrim(value).toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (slug) {
    return slug;
  }
  const fallbackSuffix = generateUniqueId('npc').split('-').pop();
  return `npc-${fallbackSuffix}`;
};

const buildFallbackNpcSeeds = (world: World): GeneratedNPCResult[] => {
  const baseName = safeTrim(world.name) || 'this world';

  return Array.from({ length: 3 }).map((_, index) => {
    const ordinal = index + 1;
    const name = `Resident ${ordinal} of ${baseName}`;
    return {
      id: slugify(name),
      name,
      description: `A supporting character from ${baseName}.`,
    };
  });
};

async function generateNpcRosterForWorld(world: World): Promise<GeneratedNPCResult[]> {
  if (process.env.NODE_ENV === 'test') {
    return buildFallbackNpcSeeds(world);
  }

  const client = createDefaultGeminiClient();
  const prompt = `You are assisting a narrative world-building engine. Based on the world description below, invent exactly three non-player characters who will appear frequently in story scenes.

Return STRICT JSON with this shape:
{
  "npcs": [
    {
      "id": "kebab-case-identifier",
      "name": "NPC display name",
      "description": "One or two vivid sentences summarizing personality and role",
      "avatarPrompt": "(optional) Short visual prompt for portrait generation"
    }
  ]
}

World name: ${world.name}
Genre: ${world.genre || 'unspecified'}
Description: ${world.description}
Key attributes: ${(world.attributes || []).slice(0, 4).map((attr) => `${attr.name}: ${attr.description}`).join('; ') || 'None'}
Signature skills: ${(world.skills || []).slice(0, 4).map((skill) => `${skill.name}: ${skill.description}`).join('; ') || 'None'}

Every NPC must fit this world snugly. IDs must be unique, lowercase, kebab-case strings suitable for use as stable identifiers.`;

  try {
    const response = await client.generateContent(prompt);
    const raw = response.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in NPC response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as { npcs?: GeneratedNPCResult[] };
    const roster = Array.isArray(parsed?.npcs) ? parsed.npcs : [];

    if (roster.length === 0) {
      throw new Error('NPC roster empty');
    }

    return roster
      .map((npc) => ({
        id: npc?.id ? slugify(npc.id) : slugify(npc?.name ?? ''),
        name: safeTrim(npc?.name) || '',
        description: safeTrim(npc?.description) || '',
        avatarPrompt: npc?.avatarPrompt ? safeTrim(npc.avatarPrompt) : undefined,
        // Note: We don't use avatarUrl from AI - portraits are generated separately
      }))
      .filter((npc) => npc.name.length > 0 && npc.description.length > 0);
  } catch (error) {
    logger.warn('Falling back to default NPC seeds for world', { worldId: world.id, error });
    return buildFallbackNpcSeeds(world);
  }
}

/**
 * Generate AI-powered tone settings for world data
 */
async function generateAIToneSettings(worldData: Partial<World>): Promise<ToneSettings> {
  try {
    const client = createDefaultGeminiClient();
    const analysisData = extractWorldAnalysisData(worldData);

    const result = await generateToneSettings(client, analysisData);

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
    const resolvedGenre = toGenreValue(
      customizations?.genre ? customizations.genre : generatedData.genre
    );

    const initialWorldData = {
      name: customizations.name || generatedData.name,
      description: customizations.description || generatedData.description,
      genre: resolvedGenre,
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

    try {
      await this.generateWorldNpcRoster(finalWorld);
    } catch (error) {
      logger.warn('Failed to generate NPC roster for world', { worldId: createdWorldId, error });
    }

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

  async generateWorldNpcRoster(world: World | undefined): Promise<void> {
    if (!world) return;

    const npcStore = useNPCStore.getState();
    if (!npcStore || typeof npcStore.createNPC !== 'function') {
      return;
    }

    const existingIds = npcStore.worldNpcs[world.id];
    if (Array.isArray(existingIds) && existingIds.length > 0) {
      return; // already seeded
    }

    const roster = await generateNpcRosterForWorld(world);
    const used = new Set<string>();

    roster.forEach((npc, index) => {
      const fallbackId = slugify(npc.name || `npc-${index + 1}`);
      let finalId = npc.id ? slugify(npc.id) : fallbackId;
      let counter = 1;
      while (used.has(finalId)) {
        finalId = `${fallbackId}-${counter++}`;
      }
      used.add(finalId);

      const name = safeTrim(npc.name) || `Companion ${index + 1}`;
      const description = safeTrim(npc.description) || 'Supporting character for this world.';

      try {
        const payload: Parameters<typeof npcStore.createNPC>[0] = {
          id: finalId,
          worldId: world.id,
          name,
          description,
        };

        npcStore.createNPC(payload);

        // Generate portrait in background - portraits are always generated, never from AI response
        npcPortraitService.generateForNPC(finalId, world).catch((error) => {
          logger.warn('NPC portrait generation failed, using initials fallback', {
            npcId: finalId,
            worldId: world.id,
            error
          });
        });
      } catch (error) {
        logger.warn('Failed to seed NPC', { worldId: world.id, finalId, error });
      }
    });
  },
};

export const ensureWorldNpcRoster = async (worldId: string): Promise<void> => {
  if (!worldId) return;
  const { worlds } = useWorldStore.getState();
  const world = worlds[worldId];
  if (!world) return;
  await worldCreationService.generateWorldNpcRoster(world);
};
