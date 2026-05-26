import { 
  generateAICharacter, 
  GeneratedCharacterData 
} from '../generators/characterGenerator';
import { World } from '@/types/world.types';

// Re-export types for backward compatibility
export type { GeneratedCharacterData };

/**
 * Generates a character for a specific world using AI
 * @param world - The world to generate a character for
 * @param existingCharacterNames - List of character names that already exist (to avoid duplicates)
 * @param suggestedName - Optional custom name for the character
 * @param generationType - Type of character to generate ('known' | 'original' | 'specific')
 * @param concept - Optional free-text character concept to steer the generation
 * @returns Generated character data
 * @throws Error if generation fails or response is invalid
 */
export async function generateCharacter(
  world: World,
  existingCharacterNames: string[],
  suggestedName?: string,
  generationType?: 'known' | 'original' | 'specific',
  concept?: string
): Promise<GeneratedCharacterData> {
  // Random generation type if not specified
  const effectiveType = generationType ?? (Math.random() < 0.5 ? 'known' : 'original');
  return generateAICharacter(world, existingCharacterNames, suggestedName, effectiveType, concept);
}
