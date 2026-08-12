import { World } from '@/types/world.types';
import Logger from '../utils/logger';
import { validateWorld } from '@/lib/utils/typeGuards';
import { extractJsonObject } from '@/lib/ai/parseJSON';

// Character level range for generated characters
const CHARACTER_LEVEL_RANGE = { min: 1, max: 5 };

export interface GeneratedCharacterData {
  name: string;
  background: {
    description: string;
    personality: string;
    motivation: string;
    fears: string[];
    physicalDescription?: string;
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

export type CharacterGenerationType = 'known' | 'original' | 'specific';

interface CharacterGenerationOptions {
  world: World;
  existingNames?: string[];
  suggestedName?: string;
  generationType?: CharacterGenerationType;
  /** Free-text character concept from the user, used to steer AI suggestions. */
  concept?: string;
}

const logger = new Logger('CharacterGenerator');

/**
 * Generate character using AI
 */
async function generateWithAI(
  options: CharacterGenerationOptions,
  apiKey?: string | null,
  model?: string | null
): Promise<GeneratedCharacterData> {
  const { world, existingNames = [], suggestedName, generationType = 'known', concept } = options;
  
  // Validate the world data first
  const worldValidation = validateWorld(world);
  if (!worldValidation.valid) {
    logger.error('CharacterGenerator', 'Invalid world data provided:', worldValidation.errors[0]);
    throw new Error(`Cannot generate character: Invalid world data - ${worldValidation.errors[0]}`);
  }

  // Check if world has attributes and skills
  if (!world.attributes || world.attributes.length === 0) {
    logger.error('CharacterGenerator', 'World has no attributes defined. Cannot generate character.');
    throw new Error('Cannot generate character: World has no attributes defined');
  }

  if (!world.skills || world.skills.length === 0) {
    logger.error('CharacterGenerator', 'World has no skills defined. Cannot generate character.');
    throw new Error('Cannot generate character: World has no skills defined');
  }
  
  try {
    const prompt = `
You are creating a character for a ${world.genre} genre world${world.reference ? ` based on ${world.reference}` : ''}.
${world.reference && world.relationship === 'set_within' ? `\nIMPORTANT: This world is set within the ${world.reference} universe. Characters must be from ${world.reference}.` : ''}
${world.reference && world.relationship === 'inspired_by' ? `\nThis world is inspired by ${world.reference} but has original characters.` : ''}
${world.description ? `\nWorld Context: ${world.description}` : ''}
${concept ? `\nThe user describes this character concept: "${concept}". Build the character around this concept, fitting it to the world's theme and genre.` : ''}
${suggestedName ? `\nThe character should be named: "${suggestedName}"` : ''}
${existingNames.length > 0 ? `\nIMPORTANT: These character names already exist and must NOT be used: ${existingNames.join(', ')}` : ''}

World Attributes: ${world.attributes?.map(a => `${a.name} (${a.minValue}-${a.maxValue})`).join(', ') || 'None defined'}
World Skills: ${world.skills?.map(s => s.name).join(', ') || 'None defined'}

Create a character that:
${generationType === 'specific' && suggestedName ? 
  `1. Is named "${suggestedName}" and MUST be a REAL, EXISTING character from ${world.reference ? `the actual ${world.reference} source material` : 'this world'}` :
  generationType === 'known' ?
  `1. MUST be a REAL, EXISTING character from ${world.reference ? `the actual ${world.reference} source material. Use only actual named characters that appear in ${world.reference}. Do NOT make up new characters!` : 'this world'} (NOT made up)` :
  `1. Should be an original character that fits the world theme and has never appeared in any source material`
}
2. Is NOT one of the existing characters listed above (check names carefully)
3. Has an interesting background story that fits the world
4. Has a distinct personality
5. Has clear motivations
6. Has balanced attributes (distribute points fairly, not all max or min)
7. Has varied skill levels (some high, some medium, some low)
8. Fits naturally into the world's setting

Think about this character's strengths and weaknesses, then assign appropriate attribute and skill values.

For attributes, consider:
${world.attributes?.map(a => `- ${a.name} (${a.minValue}-${a.maxValue}): How strong is this character in this area?`).join('\n') || '- No attributes defined for this world'}

For skills, consider:
${world.skills?.map(s => `- ${s.name} (1-10): What is their experience level?`).join('\n') || '- No skills defined for this world'}

Generate a character and return ONLY a valid JSON object:

{
  "name": "Character Name",
  "background": {
    "description": "Their complete history and background story",
    "personality": "Their personality traits and behavioral patterns",
    "motivation": "What drives them and their goals",
    "fears": ["List 2-3 specific fears or anxieties this character has"],
    "physicalDescription": "Their appearance including age, race/ethnicity, height, build, hair, eyes, and typical clothing"
  },
  "attributes": [${world.attributes?.map((a) => `
    {"id": "${a.id}", "value": REPLACE_WITH_NUMBER_${a.minValue}_TO_${a.maxValue}}`).join(',') || ''}
  ],
  "skills": [${world.skills?.map((s) => `
    {"id": "${s.id}", "level": REPLACE_WITH_NUMBER_1_TO_10}`).join(',') || ''}
  ]
}

CRITICAL INSTRUCTIONS:
- Replace ALL "REPLACE_WITH_NUMBER_X_TO_Y" with actual numbers in the specified ranges
- DO NOT use the same number for all attributes - vary them based on the character's background
- Make 2-3 attributes high (reflecting strengths), 2-3 moderate, and 1-2 low (reflecting weaknesses)
- Skill levels: 1-3=beginner, 4-6=competent, 7-8=expert, 9-10=master
- Return ONLY valid JSON with numbers, no placeholder text`;

    // Import and use the AI client directly for server-side usage
    const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
    const client = createDefaultGeminiClient(apiKey, model);
    
    // Generate with AI
    const response = await client.generateContent(prompt);
    const apiResponse = {
      content: response.content,
      finishReason: response.finishReason
    };
    
    // Extract JSON from response
    const json = extractJsonObject(apiResponse.content);
    if (json === null) {
      logger.error('CharacterGenerator', 'No JSON found in response:', apiResponse.content);
      throw new Error('No valid JSON found in response');
    }
    
    // Clean the JSON string before parsing
    let jsonString = json;
    
    // Remove any comments that might have been included
    jsonString = jsonString.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Remove any placeholder text that wasn't replaced with random values within ranges
    jsonString = jsonString.replace(/REPLACE_WITH_NUMBER_(\d+)_TO_(\d+)/g, (match: string, min: string, max: string) => {
      const minVal = parseInt(min, 10);
      const maxVal = parseInt(max, 10);
      const randomValue = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      return String(randomValue);
    });
    
    // Fallback for any remaining number placeholders
    jsonString = jsonString.replace(/<number>/g, () => {
      return '5';
    });
    
    // Remove trailing commas before closing brackets/braces
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    // Fix common JSON issues
    // Normalize quotes to ensure valid JSON
    const { normalizeQuotationMarks } = await import('@/lib/utils/textNormalization');
    jsonString = normalizeQuotationMarks(jsonString);
    
    // Remove any non-printable characters
    jsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Ensure proper escaping of quotes inside strings
    jsonString = jsonString.replace(/"([^"]*)":/g, (_: string, key: string) => {
      // Escape any unescaped quotes inside the key
      const escapedKey = key.replace(/\\"/g, '"').replace(/"/g, '\\"');
      return `"${escapedKey}":`;
    });
    
    let characterData: GeneratedCharacterData;
    try {
      characterData = JSON.parse(jsonString) as GeneratedCharacterData;
      
      // Check if all attributes are the same value (likely all 5s) and fix it
      const attributeValues = characterData.attributes.map(a => a.value);
      const allSameValue = attributeValues.every(val => val === attributeValues[0]);
      
      if (allSameValue && attributeValues[0] === 5) {
        // Create a varied distribution for the character
        characterData.attributes = characterData.attributes.map((attr, index) => {
          const worldAttr = world.attributes.find(wa => wa.id === attr.id);
          if (!worldAttr) return attr;
          
          // Create varied distribution: some high, some medium, some low
          let value: number;
          const remainder = index % 3;
          if (remainder === 0) {
            // High values (70-100% of range)
            const range = worldAttr.maxValue - worldAttr.minValue;
            value = Math.floor(worldAttr.minValue + range * 0.7 + Math.random() * range * 0.3);
          } else if (remainder === 1) {
            // Medium values (40-70% of range)
            const range = worldAttr.maxValue - worldAttr.minValue;
            value = Math.floor(worldAttr.minValue + range * 0.4 + Math.random() * range * 0.3);
          } else {
            // Low values (0-40% of range)
            const range = worldAttr.maxValue - worldAttr.minValue;
            value = Math.floor(worldAttr.minValue + Math.random() * range * 0.4);
          }
          
          // Ensure value is within bounds
          value = Math.max(worldAttr.minValue, Math.min(worldAttr.maxValue, value));
          
          return { ...attr, value };
        });
      }
    } catch (parseError) {
      logger.error('CharacterGenerator', 'JSON parse error:', parseError);
      logger.error('CharacterGenerator', 'Failed JSON string:', jsonString);
      throw new Error(`Failed to parse character JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    // Use suggested name if provided
    if (suggestedName) {
      characterData.name = suggestedName;
    }
    
    // Validate and clamp all attribute values to world bounds
    const originalAttributeCount = characterData.attributes.length;
    characterData.attributes = characterData.attributes.map(attr => {
      const worldAttr = world.attributes.find(wa => wa.id === attr.id);
      if (!worldAttr) {
        logger.warn('CharacterGenerator', `AI generated attribute with unknown ID "${attr.id}", removing from character`);
        return null; // Mark for removal
      }
      
      // Validate attribute structure
      if (!attr.id || typeof attr.value !== 'number') {
        logger.warn('CharacterGenerator', `AI generated invalid attribute structure:`, attr);
        // Create a safe default based on world attribute
        return {
          id: worldAttr.id,
          value: worldAttr.baseValue || Math.floor((worldAttr.minValue + worldAttr.maxValue) / 2)
        };
      }
      
      // Clamp value to valid range
      const clampedValue = Math.max(worldAttr.minValue, Math.min(worldAttr.maxValue, attr.value));
      
      return { ...attr, value: clampedValue };
    }).filter(attr => attr !== null); // Remove invalid attributes
    
    // Log removed attributes count
    const removedAttributesCount = originalAttributeCount - characterData.attributes.length;
    if (removedAttributesCount > 0) {
      logger.info('CharacterGenerator', `Removed ${removedAttributesCount} invalid attribute(s) during validation`);
    }
    
    // Validate and clamp all skill levels to 0-10 range
    const originalSkillCount = characterData.skills.length;
    characterData.skills = characterData.skills.map(skill => {
      const worldSkill = world.skills.find(ws => ws.id === skill.id);
      if (!worldSkill) {
        logger.warn('CharacterGenerator', `AI generated skill with unknown ID "${skill.id}", removing from character`);
        return null; // Mark for removal
      }
      
      // Validate skill structure
      if (!skill.id || typeof skill.level !== 'number') {
        logger.warn('CharacterGenerator', `AI generated invalid skill structure:`, skill);
        // Create a safe default based on world skill
        return {
          id: worldSkill.id,
          level: 1 // Default to beginner level
        };
      }
      
      const clampedLevel = Math.max(0, Math.min(10, skill.level));
      
      return { ...skill, level: clampedLevel };
    }).filter(skill => skill !== null); // Remove invalid skills
    
    // Log removed skills count
    const removedSkillsCount = originalSkillCount - characterData.skills.length;
    if (removedSkillsCount > 0) {
      logger.info('CharacterGenerator', `Removed ${removedSkillsCount} invalid skill(s) during validation`);
    }
    
    // Validate the generated character
    if (!characterData.name || typeof characterData.name !== 'string' || characterData.name.trim() === '') {
      throw new Error('Generated character has no valid name');
    }
    
    if (!characterData.attributes || characterData.attributes.length === 0) {
      logger.error('CharacterGenerator', 'Generated character has no valid attributes after validation');
      throw new Error('Generated character has no valid attributes');
    }
    
    if (!characterData.skills || characterData.skills.length === 0) {
      logger.error('CharacterGenerator', 'Generated character has no valid skills after validation');
      throw new Error('Generated character has no valid skills');
    }
    
    // Validate background structure
    if (!characterData.background || typeof characterData.background !== 'object') {
      logger.warn('CharacterGenerator', 'AI generated invalid background, using defaults');
      characterData.background = {
        description: 'A mysterious character with an unknown past.',
        personality: 'Determined and resourceful.',
        motivation: 'Seeking their place in the world.',
        fears: ['The unknown', 'Being forgotten']
      };
    }
    
    // Ensure background has required fields
    if (!characterData.background.description || typeof characterData.background.description !== 'string') {
      characterData.background.description = 'A mysterious character with an unknown past.';
    }
    if (!characterData.background.personality || typeof characterData.background.personality !== 'string') {
      characterData.background.personality = 'Determined and resourceful.';
    }
    if (!characterData.background.motivation || typeof characterData.background.motivation !== 'string') {
      characterData.background.motivation = 'Seeking their place in the world.';
    }
    if (!Array.isArray(characterData.background.fears) || characterData.background.fears.length === 0) {
      characterData.background.fears = ['The unknown', 'Being forgotten'];
    }
    
    // Check for duplicate names (case-insensitive)
    const normalizedExistingNames = existingNames.map(name => name.toLowerCase());
    if (normalizedExistingNames.includes(characterData.name.toLowerCase())) {
      throw new Error(`Character name "${characterData.name}" already exists in this world`);
    }
    
    // Set character metadata based on generation type
    if (generationType === 'known' || generationType === 'specific') {
      characterData.isKnownFigure = true;
      characterData.characterType = 'protagonist'; // Default for known characters
    } else if (generationType === 'original') {
      characterData.isKnownFigure = false;
      characterData.characterType = 'original';
    }

    // Calculate character level (1-5 range) - not from AI
    characterData.level = Math.floor(Math.random() * (CHARACTER_LEVEL_RANGE.max - CHARACTER_LEVEL_RANGE.min + 1)) + CHARACTER_LEVEL_RANGE.min;

    return characterData;
  } catch (error) {
    // Re-throw duplicate name errors immediately
    if (error instanceof Error && error.message.includes('already exists in this world')) {
      throw error;
    }

    logger.error('CharacterGenerator', 'AI generation failed:', error);

    if (generationType === 'known' || generationType === 'specific') {
      throw new Error(`Failed to generate known character from ${world.reference || 'this world'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    throw new Error(`Failed to generate character: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateAICharacter(
  world: World,
  existingCharacterNames: string[],
  suggestedName?: string,
  generationType: CharacterGenerationType = 'known',
  concept?: string,
  apiKey?: string | null,
  model?: string | null
): Promise<GeneratedCharacterData> {
  return generateWithAI({
    world,
    existingNames: existingCharacterNames,
    suggestedName,
    generationType,
    concept
  }, apiKey, model);
}
