import { World } from '@/types/world.types';
import { createAIClient } from './clientFactory';
import Logger from '../utils/logger';

const logger = new Logger('CharacterGenerator');

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity score between 0 and 1, where 1 is identical
 */
function calculateNameSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len2][len1]) / maxLen;
}

export interface GeneratedCharacterData {
  name: string;
  background: {
    description: string;
    personality: string;
    motivation: string;
  };
  attributes: Array<{
    id: string;
    value: number;
  }>;
  skills: Array<{
    id: string;
    level: number;
  }>;
  level: number;
  isKnownFigure?: boolean;
  characterType?: 'protagonist' | 'antagonist' | 'supporting' | 'original';
}

/**
 * Generate a character for a given world using AI
 * @param world - The world configuration containing attributes, skills, and theme
 * @param existingCharacterNames - List of character names that already exist (to avoid duplicates)
 * @param suggestedName - Optional name to use for the character
 * @param generationType - Type of character to generate:
 *   - 'known': Generate a canonical character from the source material
 *   - 'original': Generate a completely new character that fits the world
 *   - 'specific': Generate a character with the suggested name
 * @returns Generated character data including name, background, attributes, and skills
 * @throws Error if generation fails or duplicate names are detected
 */
export async function generateCharacter(
  world: World,
  existingCharacterNames: string[],
  suggestedName?: string,
  generationType: 'known' | 'original' | 'specific' = 'known'
): Promise<GeneratedCharacterData> {
  try {
    const prompt = `
You are creating a character for the world "${world.name}" with the theme "${world.theme}".
${world.description ? `\nWorld Context: ${world.description}` : ''}
${suggestedName ? `\nThe character should be named: "${suggestedName}"` : ''}
${existingCharacterNames.length > 0 ? `\nIMPORTANT: These character names already exist in this world and must NOT be used: ${existingCharacterNames.join(', ')}` : ''}

World Attributes: ${world.attributes.map(a => `${a.name} (${a.minValue}-${a.maxValue})`).join(', ')}
World Skills: ${world.skills.map(s => s.name).join(', ')}

Create a character that:
${generationType === 'specific' && suggestedName ? 
  `1. Is named "${suggestedName}"` :
  generationType === 'known' ?
  `1. MUST be a REAL, EXISTING character from the actual ${world.name} source material (NOT made up)` :
  `1. Should be an original character that fits the ${world.name} world theme`
}
2. Is NOT one of the existing characters listed above (check names carefully)
3. Has an interesting background story that fits the world
4. Has a distinct personality
5. Has clear motivations
6. Has balanced attributes (distribute points fairly, not all max or min)
7. Has varied skill levels (some high, some medium, some low)
8. Fits naturally into the world's setting

${generationType === 'known' ? `
CRITICAL: You MUST create a REAL character that ACTUALLY EXISTS in the ${world.name} source material.
- Research the actual characters from ${world.name}
- Do NOT invent, create, or make up character names
- Only use characters that genuinely appear in the original work
- If you're not certain a character exists, choose one you're absolutely sure about

Priority order for known character generation:
1. Main protagonist(s) from ${world.name}
2. Major antagonists/villains from ${world.name}
3. Important supporting characters from ${world.name}
4. Secondary characters who play significant roles

The character's background, personality, and motivation MUST reflect their actual story and role from the source material.
Their attributes and skills should accurately represent their canonical abilities.` : ''}

${generationType === 'original' ? `
Create a completely original character that:
- Has never appeared in the source material
- Fits naturally into the world's setting and tone
- Could believably exist alongside the known characters
- Has their own unique story and motivations` : ''}

Respond with ONLY valid JSON in this format:
{
  "name": "Character Name",
  "level": 3,
  "background": {
    "description": "Their history and background story...",
    "personality": "Their personality traits...",
    "motivation": "What drives them..."
  },
  "attributes": [
    ${world.attributes.map(a => `{"id": "${a.id}", "value": <number between ${a.minValue} and ${a.maxValue}>}`).join(',\n    ')}
  ],
  "skills": [
    ${world.skills.map(s => `{"id": "${s.id}", "level": <number between 0 and 10>}`).join(',\n    ')}
  ]
}`;

    const client = createAIClient();
    const response = await client.generateContent(prompt);
    
    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const characterData = JSON.parse(jsonMatch[0]) as GeneratedCharacterData;
    
    // Use suggested name if provided
    if (suggestedName) {
      characterData.name = suggestedName;
    }
    
    // Validate the generated character
    if (!characterData.name) {
      throw new Error('Generated character has no name');
    }
    
    // Check for exact duplicates and similar names
    const normalizedNewName = characterData.name.toLowerCase().trim();
    const existingNormalized = existingCharacterNames.map(name => name.toLowerCase().trim());
    
    if (existingNormalized.includes(normalizedNewName)) {
      throw new Error(`A character named "${characterData.name}" already exists in this world. Please try a different name or leave the name field empty for a unique character.`);
    }
    
    // Check for very similar names (to catch typos or slight variations)
    for (const existingName of existingCharacterNames) {
      const similarity = calculateNameSimilarity(normalizedNewName, existingName.toLowerCase().trim());
      if (similarity > 0.8) {
        logger.warn(`Generated name "${characterData.name}" is very similar to existing character "${existingName}"`);
      }
    }
    
    // Validate attributes are within bounds
    characterData.attributes.forEach(attr => {
      const worldAttr = world.attributes.find(wa => wa.id === attr.id);
      if (worldAttr) {
        attr.value = Math.max(worldAttr.minValue, Math.min(worldAttr.maxValue, attr.value));
      }
    });
    
    // Validate skills are within bounds (0-10)
    characterData.skills.forEach(skill => {
      skill.level = Math.max(0, Math.min(10, skill.level));
    });
    
    return characterData;
  } catch (error) {
    logger.error('Failed to generate character:', error);
    throw new Error('Failed to generate character. Please try again.');
  }
}