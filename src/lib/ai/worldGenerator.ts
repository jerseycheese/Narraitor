import { generateAIWorld, GeneratedWorldData } from '../generators/worldGenerator';

// Re-export types for backward compatibility
export type { GeneratedWorldData };

/**
 * Generates a complete world configuration based on a fictional or non-fictional world reference
 * @param worldReference - Reference to base the world on (e.g., "Lord of the Rings", "Star Wars", "Ancient Rome")
 * @param worldRelationship - Whether to create a world 'set_in' the reference or 'based_on' it
 * @param existingWorldNames - List of world names that already exist (to avoid duplicates)
 * @param suggestedName - Optional custom name for the world (will override AI-generated name)
 * @returns Generated world data including name, theme, attributes, skills, and settings
 * @throws Error if generation fails or response is invalid
 */
export async function generateWorld(
  worldReference: string,
  worldRelationship: 'based_on' | 'set_in',
  existingWorldNames: string[],
  suggestedName?: string
): Promise<GeneratedWorldData> {
  return generateAIWorld(worldReference, worldRelationship, existingWorldNames, suggestedName);
}