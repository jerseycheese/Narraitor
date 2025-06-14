import { World } from '@/types/world.types';
import Logger from '../utils/logger';

const logger = new Logger('CharacterGenerator');

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

export type CharacterGenerationMethod = 'template' | 'ai';
export type CharacterGenerationType = 'known' | 'original' | 'specific';

export interface CharacterGenerationOptions {
  method: CharacterGenerationMethod;
  world: World;
  existingNames?: string[];
  suggestedName?: string;
  generationType?: CharacterGenerationType;
}

/**
 * Unified character generation function
 */
export async function generateCharacter(options: CharacterGenerationOptions): Promise<GeneratedCharacterData> {
  if (options.method === 'template') {
    return generateFromTemplate(options);
  } else {
    return generateWithAI(options);
  }
}

/**
 * Generate character from predefined templates
 */
function generateFromTemplate(options: CharacterGenerationOptions): GeneratedCharacterData {
  const { world } = options;
  
  // Simple template-based character generation
  const characterNames = [
    'Aelwyn', 'Bjorn', 'Cassandra', 'Dorian', 'Elena', 'Finn',
    'Gwendolyn', 'Henrik', 'Isla', 'Jaxon', 'Kira', 'Lysander',
    'Mira', 'Nolan', 'Ophelia', 'Phoenix', 'Quinn', 'Raven',
    'Sage', 'Thorne', 'Una', 'Vex', 'Wren', 'Xara', 'Yuki', 'Zara'
  ];
  
  const personalities = [
    'Brave and determined, always ready to face danger head-on',
    'Cunning and strategic, preferring to outthink opponents',
    'Compassionate and healing, dedicated to helping others',
    'Mysterious and aloof, harboring deep secrets',
    'Cheerful and optimistic, finding hope in dark times',
    'Stern and disciplined, following a strict code of honor'
  ];
  
  const motivations = [
    'Seeking revenge for a great wrong',
    'Protecting loved ones from harm',
    'Uncovering ancient mysteries',
    'Proving their worth to others',
    'Finding their true purpose in life',
    'Restoring balance to the world'
  ];
  
  const fears = [
    ['Failure', 'Being alone', 'Loss of control'],
    ['Betrayal', 'The dark', 'Being forgotten'],
    ['Heights', 'Enclosed spaces', 'Public speaking'],
    ['Death', 'Abandonment', 'Making the wrong choice'],
    ['The unknown', 'Being judged', 'Losing their identity']
  ];
  
  // Pick random elements
  const baseName = options.suggestedName || characterNames[Math.floor(Math.random() * characterNames.length)];
  let finalName = baseName;
  
  // Ensure unique name
  if (options.existingNames?.includes(finalName)) {
    let suffix = 1;
    while (options.existingNames.includes(`${baseName} ${suffix}`)) {
      suffix++;
    }
    finalName = `${baseName} ${suffix}`;
  }
  
  // Generate varied attribute values
  const attributes = world.attributes.map(attr => ({
    id: attr.id,
    value: Math.floor(Math.random() * (attr.maxValue - attr.minValue + 1)) + attr.minValue
  }));
  
  // Generate varied skill levels (some selected, some not)
  const selectedSkills = world.skills
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, Math.floor(world.skills.length * 0.7)) // Select 70%
    .map(skill => ({
      id: skill.id,
      level: Math.floor(Math.random() * 5) + 1 // 1-5
    }));
  
  return {
    name: finalName,
    level: Math.floor(Math.random() * 3) + 1, // Level 1-3
    background: {
      description: `A mysterious figure with an interesting past${world.reference ? ` from the ${world.reference} universe` : ''}.`,
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      motivation: motivations[Math.floor(Math.random() * motivations.length)],
      fears: fears[Math.floor(Math.random() * fears.length)],
      physicalDescription: `${Math.floor(Math.random() * 40) + 20}-year-old human of average height and build with distinctive features befitting the ${world.theme} setting.`
    },
    attributes,
    skills: selectedSkills,
    isKnownFigure: false,
    characterType: 'original'
  };
}

/**
 * Generate character using AI
 */
async function generateWithAI(options: CharacterGenerationOptions): Promise<GeneratedCharacterData> {
  const { world, existingNames = [], suggestedName, generationType = 'known' } = options;
  
  logger.debug('CharacterGenerator', `Generating ${generationType} character for world:`, {
    worldName: world.name,
    worldReference: world.reference,
    worldRelationship: world.relationship,
    theme: world.theme
  });
  
  try {
    const prompt = `
You are creating a character for a ${world.theme} themed world${world.reference ? ` based on ${world.reference}` : ''}.
${world.reference && world.relationship === 'set_in' ? `\nIMPORTANT: This world is set within the ${world.reference} universe. Characters must be from ${world.reference}.` : ''}
${world.reference && world.relationship === 'based_on' ? `\nThis world is inspired by ${world.reference} but has original characters.` : ''}
${world.description ? `\nWorld Context: ${world.description}` : ''}
${suggestedName ? `\nThe character should be named: "${suggestedName}"` : ''}
${existingNames.length > 0 ? `\nIMPORTANT: These character names already exist and must NOT be used: ${existingNames.join(', ')}` : ''}

World Attributes: ${world.attributes.map(a => `${a.name} (${a.minValue}-${a.maxValue})`).join(', ')}
World Skills: ${world.skills.map(s => s.name).join(', ')}

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
${world.attributes.map(a => `- ${a.name} (${a.minValue}-${a.maxValue}): How strong is this character in this area?`).join('\n')}

For skills, consider:
${world.skills.map(s => `- ${s.name} (1-10): What is their experience level?`).join('\n')}

Generate a character and return ONLY a valid JSON object:

{
  "name": "Character Name",
  "level": 3,
  "background": {
    "description": "Their complete history and background story",
    "personality": "Their personality traits and behavioral patterns", 
    "motivation": "What drives them and their goals",
    "fears": ["List 2-3 specific fears or anxieties this character has"],
    "physicalDescription": "Their appearance including age, race/ethnicity, height, build, hair, eyes, and typical clothing"
  },
  "attributes": [${world.attributes.map((a) => `
    {"id": "${a.id}", "value": REPLACE_WITH_NUMBER_${a.minValue}_TO_${a.maxValue}}`).join(',')}
  ],
  "skills": [${world.skills.map((s) => `
    {"id": "${s.id}", "level": REPLACE_WITH_NUMBER_1_TO_10}`).join(',')}
  ]
}

CRITICAL INSTRUCTIONS:
- Replace ALL "REPLACE_WITH_NUMBER_X_TO_Y" with actual numbers in the specified ranges
- DO NOT use the same number for all attributes - vary them based on the character's background
- Make 2-3 attributes high (reflecting strengths), 2-3 moderate, and 1-2 low (reflecting weaknesses)
- Skill levels: 1-3=beginner, 4-6=competent, 7-8=expert, 9-10=master
- Return ONLY valid JSON with numbers, no placeholder text`;

    logger.debug('CharacterGenerator', 'Generated prompt:', prompt);
    
    // Import and use the AI client directly for server-side usage
    const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
    const client = createDefaultGeminiClient();
    
    // Generate with AI
    const response = await client.generateContent(prompt);
    const apiResponse = {
      content: response.content,
      finishReason: response.finishReason
    };
    
    // Log the raw response for debugging
    logger.debug('CharacterGenerator', 'Raw AI response:', apiResponse.content);
    
    // Extract JSON from response
    const jsonMatch = apiResponse.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('CharacterGenerator', 'No JSON found in response:', apiResponse.content);
      throw new Error('No valid JSON found in response');
    }
    
    // Clean the JSON string before parsing
    let jsonString = jsonMatch[0];
    
    // Log the raw JSON before cleaning for debugging
    logger.debug('CharacterGenerator', 'Raw JSON before cleaning:', jsonString.substring(0, 200) + '...');
    
    // Remove any comments that might have been included
    jsonString = jsonString.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Remove any placeholder text that wasn't replaced with random values within ranges
    jsonString = jsonString.replace(/REPLACE_WITH_NUMBER_(\d+)_TO_(\d+)/g, (match: string, min: string, max: string) => {
      const minVal = parseInt(min, 10);
      const maxVal = parseInt(max, 10);
      const randomValue = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      logger.debug('CharacterGenerator', `Replacing placeholder ${match} with ${randomValue}`);
      return String(randomValue);
    });
    
    // Fallback for any remaining number placeholders
    jsonString = jsonString.replace(/<number>/g, (match: string) => {
      logger.debug('CharacterGenerator', `Found unhandled placeholder ${match}, using fallback value 5`);
      return '5';
    });
    
    // Remove trailing commas before closing brackets/braces
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    // Fix common JSON issues
    // Replace smart quotes with regular quotes
    jsonString = jsonString.replace(/[""]/g, '"');
    jsonString = jsonString.replace(/['']/g, "'");
    
    // Remove any non-printable characters
    jsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Ensure proper escaping of quotes inside strings
    jsonString = jsonString.replace(/"([^"]*)":/g, (match: string, key: string) => {
      // Escape any unescaped quotes inside the key
      const escapedKey = key.replace(/\\"/g, '"').replace(/"/g, '\\"');
      return `"${escapedKey}":`;
    });
    
    logger.debug('CharacterGenerator', 'Cleaned JSON string:', jsonString.substring(0, 500) + '...');
    
    let characterData: GeneratedCharacterData;
    try {
      characterData = JSON.parse(jsonString) as GeneratedCharacterData;
      logger.debug('CharacterGenerator', 'Parsed character data:', JSON.stringify(characterData, null, 2));
      logger.debug('CharacterGenerator', 'Generated attribute values:', characterData.attributes.map(a => `${a.id}: ${a.value}`));
      
      // Check if all attributes are the same value (likely all 5s) and fix it
      const attributeValues = characterData.attributes.map(a => a.value);
      const allSameValue = attributeValues.every(val => val === attributeValues[0]);
      
      if (allSameValue && attributeValues[0] === 5) {
        logger.debug('CharacterGenerator', 'Detected all attributes are 5, applying varied distribution');
        
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
          
          logger.debug('CharacterGenerator', `Fixed attribute ${attr.id}: ${attr.value} -> ${value}`);
          return { ...attr, value };
        });
        
        logger.debug('CharacterGenerator', 'Fixed attribute values:', characterData.attributes.map(a => `${a.id}: ${a.value}`));
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
    characterData.attributes = characterData.attributes.map(attr => {
      const worldAttr = world.attributes.find(wa => wa.id === attr.id);
      if (!worldAttr) return attr;
      
      // Clamp value to valid range
      const clampedValue = Math.max(worldAttr.minValue, Math.min(worldAttr.maxValue, attr.value));
      if (clampedValue !== attr.value) {
        logger.debug('CharacterGenerator', `Clamped attribute ${attr.id}: ${attr.value} -> ${clampedValue} (range: ${worldAttr.minValue}-${worldAttr.maxValue})`);
      }
      
      return { ...attr, value: clampedValue };
    });
    
    // Validate and clamp all skill levels to 0-10 range
    characterData.skills = characterData.skills.map(skill => {
      const clampedLevel = Math.max(0, Math.min(10, skill.level));
      if (clampedLevel !== skill.level) {
        logger.debug('CharacterGenerator', `Clamped skill ${skill.id}: ${skill.level} -> ${clampedLevel} (range: 0-10)`);
      }
      
      return { ...skill, level: clampedLevel };
    });
    
    // Validate the generated character
    if (!characterData.name) {
      throw new Error('Generated character has no name');
    }
    
    if (!characterData.attributes || characterData.attributes.length === 0) {
      throw new Error('Generated character has no attributes');
    }
    
    if (!characterData.skills || characterData.skills.length === 0) {
      throw new Error('Generated character has no skills');
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
    
    return characterData;
  } catch (error) {
    // Don't fall back for certain types of validation errors
    if (error instanceof Error && error.message.includes('already exists in this world')) {
      throw error; // Re-throw duplicate name errors immediately
    }
    
    logger.error('CharacterGenerator', 'AI generation failed:', error);
    
    // For known figures, we should never fall back to template generation
    if (generationType === 'known' || generationType === 'specific') {
      throw new Error(`Failed to generate known character from ${world.reference || 'this world'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Only fall back to template generation for original characters
    logger.debug('CharacterGenerator', 'Falling back to template generation for original character due to AI error');
    try {
      return generateFromTemplate({ 
        method: 'template', 
        world, 
        existingNames, 
        suggestedName,
        generationType 
      });
    } catch (templateError) {
      logger.error('CharacterGenerator', 'Template generation also failed:', templateError);
      throw error; // Throw the original AI error
    }
  }
}

// Convenience functions for backward compatibility
export function generateTestCharacter(world: World): {
  name: string;
  attributes: Array<{ attributeId: string; value: number }>;
  skills: Array<{ skillId: string; level: number; experience: number; isActive: boolean }>;
  background: {
    history: string;
    personality: string;
    goals: string[];
    motivation: string;
    physicalDescription?: string;
    isKnownFigure?: boolean;
  };
} {
  const templateData = generateFromTemplate({ method: 'template', world });
  
  // Convert to the format expected by devtools
  return {
    name: templateData.name,
    attributes: world.attributes.map(attr => {
      const generated = templateData.attributes.find(a => a.id === attr.id);
      return {
        attributeId: attr.id,
        value: generated?.value || Math.floor(Math.random() * (attr.maxValue - attr.minValue + 1)) + attr.minValue
      };
    }),
    skills: world.skills.map(skill => {
      const generated = templateData.skills.find(s => s.id === skill.id);
      return {
        skillId: skill.id,
        level: generated?.level || Math.floor(Math.random() * 5) + 1,
        experience: 0,
        isActive: !!generated // Only active if in generated skills
      };
    }),
    background: {
      history: templateData.background.description,
      personality: templateData.background.personality,
      goals: [templateData.background.motivation],
      motivation: templateData.background.motivation,
      physicalDescription: templateData.background.physicalDescription,
      isKnownFigure: templateData.isKnownFigure
    }
  };
}

export async function generateAICharacter(
  world: World,
  existingCharacterNames: string[],
  suggestedName?: string,
  generationType: CharacterGenerationType = 'known'
): Promise<GeneratedCharacterData> {
  return generateWithAI({
    method: 'ai',
    world,
    existingNames: existingCharacterNames,
    suggestedName,
    generationType
  });
}
