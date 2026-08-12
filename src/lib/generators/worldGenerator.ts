import { WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';
import { parseAIJsonResponse, validateRequiredFields, validateArrayFields } from '@/lib/utils/aiResponseParser';
import { normalizeGenre } from '@/lib/constants/genres';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';
import { validateWorldAttribute, validateWorldSkill, validateWorldSettings } from '@/lib/utils/typeGuards';

import Logger from '@/lib/utils/logger';
const logger = new Logger('WorldGenerator');

// Default fallback values for AI validation failures
const DEFAULT_WORLD_ATTRIBUTE = {
  name: 'Strength',
  description: 'Physical power and might',
  baseValue: 5,
  minValue: 1,
  maxValue: 10,
  category: 'General'
};

const DEFAULT_WORLD_SKILL = {
  name: 'Basic Knowledge',
  description: 'General knowledge and awareness',
  difficulty: 'easy' as const,
  category: 'General',
  baseValue: 1,
  minValue: 1,
  maxValue: 5,
};

export interface GeneratedWorldData {
  name: string;
  genre: string;
  description: string;
  reference?: string;
  relationship?: 'inspired_by' | 'set_within';
  attributes: Array<Omit<WorldAttribute, 'id' | 'worldId'>>;
  skills: Array<Omit<WorldSkill, 'id' | 'worldId'>>;
  settings: WorldSettings;
}

type WorldGenerationMethod = 'template' | 'ai';

export interface WorldGenerationOptions {
  method: WorldGenerationMethod;
  reference?: string; // For AI generation or specific template selection
  relationship?: 'inspired_by' | 'set_within'; // Whether world is inspired by or set within the reference
  existingNames?: string[];
  suggestedName?: string;
  genre?: string; // User-selected genre (overrides AI-generated genre)
  additionalContext?: string; // Additional user-provided context for original worlds
}

/**
 * Unified world generation function
 */
export async function generateWorld(
  options: WorldGenerationOptions,
  apiKey?: string | null,
  model?: string | null
): Promise<GeneratedWorldData> {
  // Always use AI generation, but with TV/movie inspiration
  return generateWithAI(options, apiKey, model);
}

/**
 * Generate world using AI through secure API
 */
async function generateWithAI(
  options: WorldGenerationOptions,
  apiKey?: string | null,
  model?: string | null
): Promise<GeneratedWorldData> {
  // Handle different world generation types
  let prompt: string;
  
  if (!options.reference && !options.relationship) {
    // Completely original world
    const genreInstruction = options.genre 
      ? `REQUIRED GENRE: The world MUST be in the "${options.genre}" genre. All world elements, themes, conflicts, and atmosphere must align with this genre.`
      : `IMPORTANT: Create a world based on the suggested name and setting context. Analyze the suggested name for time period and setting clues:

FOR REALISTIC SETTINGS (anything mentioning years like "1960s", "1970s", "1980s", "1990s", or real-world jobs like "Diner Cook", "Office Worker", "Taxi Driver"):
- ABSOLUTELY NO magical, supernatural, fantasy, or sci-fi elements
- ABSOLUTELY NO reality-shifting, destiny, nexus points, or metaphysical concepts  
- ABSOLUTELY NO special powers, mystical properties, or otherworldly elements
- This must be a completely mundane, realistic setting that could actually exist
- Focus on real human drama, workplace challenges, period-appropriate technology
- Example: A 1970s diner should have real 1970s equipment, real food, real customers, real workplace issues

FOR FANTASY SETTINGS (mentioning magic, dragons, wizards, etc.):
- Use Fantasy genre with appropriate magical elements

FOR SCI-FI SETTINGS (mentioning space, future, cyber, etc.):
- Use Sci-Fi genre with appropriate technological elements

CRITICAL: Match the genre to what the name actually suggests. If someone says "1970s Diner Cook" they want a realistic 1970s diner, NOT a magical diner.`;

    prompt = `Generate a complete world configuration for a text-based RPG with a completely original setting.

${genreInstruction}

The world should have:
- Name, geography, and history appropriate to the specified genre
- Genre-appropriate elements, conflicts, and atmosphere
- Period-appropriate technology and social context for the genre
- Challenges and conflicts that fit the genre expectations`
  } else {
    // World with reference (inspired by or set within)
    const reference = options.reference!;
    const isSetIn = options.relationship === 'set_within';
    
    prompt = `Generate a complete world configuration for a text-based RPG ${isSetIn ? `set within the ${reference} universe` : `inspired by the ${reference} universe`}.

${isSetIn 
  ? `CRITICAL: This RPG world is set DIRECTLY IN the ${reference} universe - it is NOT inspired by or similar to ${reference}, but is ACTUALLY WITHIN ${reference}.

ABSOLUTE REQUIREMENTS FOR "SET WITHIN" WORLDS:
- This world IS PART OF the ${reference} universe, not a copy or similar world
- Use the EXACT same rules, technology, magic systems, and social structures as ${reference}
- The world name should reference actual locations, planets, cities, or regions from ${reference}
- Characters can interact with canonical ${reference} characters, locations, and events
- Do NOT create a "similar" world - create an ACTUAL location within the ${reference} universe

EXAMPLES TO CLARIFY THE DIFFERENCE:
- If ${reference} is "Star Wars": Create a world ON AN ACTUAL Star Wars planet (like Tatooine, Coruscant, or Naboo), not a "space world with lightsabers"
- If ${reference} is "The Office": Create an ACTUAL branch office of Dunder Mifflin, not just "an office workplace"
- If ${reference} is "Breaking Bad": Create a world in ACTUAL Albuquerque with the same crime networks, not just "a crime world"
- If ${reference} is "Lord of the Rings": Create a world in ACTUAL Middle-earth (like Gondor, Rohan, or the Shire), not just "a fantasy world with magic"

CRITICAL: This is the ${reference} universe itself, not something inspired by it!`
  : `IMPORTANT: Create an ORIGINAL world that captures the essence, genres, and feeling of ${reference}, but is NOT a direct copy. The world should be inspired by ${reference} but have its own unique name, locations, and lore. Choose an appropriate genre that captures the essence of ${reference}.`
}`
  }

  // Add user-specified constraints
  if (options.suggestedName) {
    prompt += `\n\nUSER-SPECIFIED NAME: The world should be named: "${options.suggestedName}"`;
  }
  if (options.genre) {
    prompt += `\n\nUSER-SELECTED GENRE: The world MUST be in the "${options.genre}" genre. All world elements, themes, conflicts, and atmosphere must align with this genre choice.`;
  }
  if (options.additionalContext) {
    prompt += `\n\nUSER CONTEXT: ${options.additionalContext}. Incorporate this context into the world design.`;
  }
  if (options.existingNames?.length) {
    prompt += `\n\nExisting worlds to avoid duplicating: ${options.existingNames.join(', ')}`;
  }

  // Add creative naming guidance based on user-selected genre or prompt content
  const userGenre = options.genre?.toLowerCase() || '';
  const genreHint = userGenre || prompt.toLowerCase();
  let namingGuidance = '';
  
  if (userGenre.includes('fantasy') || (!userGenre && genreHint.includes('fantasy'))) {
    namingGuidance = `
- Use Celtic, Norse, or other cultural linguistics (e.g., "Vryndaal", "Korvathia", "Zhengara")
- Combine natural elements creatively (e.g., "Thornspire", "Mistholm", "Dragonmere")
- Use abstract concepts (e.g., "The Sundering", "Whisperlands", "Evermoon")`;
  } else if (userGenre.includes('sci-fi') || userGenre.includes('cyberpunk') || (!userGenre && (genreHint.includes('sci-fi') || genreHint.includes('cyberpunk')))) {
    namingGuidance = `
- Use technical/scientific terms (e.g., "Nexus Prime", "Quantum Gate", "Neural Collective")
- Combine numbers/codes (e.g., "Sector 7", "Alpha Station", "Grid 2049")
- Use corporate/futuristic names (e.g., "Neo Singapore", "CyberCore City", "Titanfall Industries")`;
  } else if (userGenre.includes('western') || (!userGenre && genreHint.includes('western'))) {
    namingGuidance = `
- Use frontier/geographic names (e.g., "Copper Canyon", "Deadwater Gulch", "Sunset Ridge")
- Historical American names (e.g., "Fort Meridian", "Silver Creek", "Tombstone Valley")`;
  } else if (userGenre.includes('horror') || (!userGenre && genreHint.includes('horror'))) {
    namingGuidance = `
- Dark, ominous names (e.g., "Ravenshollow", "The Blackmoor", "Grimhaven")
- Gothic or Victorian names (e.g., "Ashworth Manor", "Bleakshire", "Morrighan's Rest")`;
  } else {
    namingGuidance = `
- Names from different cultures and languages
- Made-up words that sound natural
- Descriptive names based on geography or history
- Abstract or poetic names`;
  }

  // Get valid genre values for the prompt
  const genreExamples = 'fantasy, sci-fi, modern, historical, horror, mystery, western, cyberpunk, other';

  prompt += `\n\nIMPORTANT: Create a UNIQUE and CREATIVE world name. Avoid overused fantasy names like "Aethelgard", "Eldoria", "Avalon", "Mystara", "Drakmoor", etc. Consider:${namingGuidance}
- Avoid generic patterns like "[Adjective][Place]" (e.g., "Darklands", "Brightshire")

Provide a JSON response with this exact structure:
{
  "name": "A creative, unique name for this world (avoid common fantasy tropes)",
  "genre": "${options.genre ? `"${options.genre}" (USER SPECIFIED - use this exactly)` : options.relationship === 'set_within' && options.reference ? `The ACTUAL genre of ${options.reference}. CRITICAL: You MUST use ONLY these exact values: ${genreExamples}. Examples: The Office = "modern", Star Wars = "sci-fi", Lord of the Rings = "fantasy", Breaking Bad = "modern", Horror movies = "horror", Deadwood = "western". Use lowercase values exactly as shown.` : `The appropriate genre based on the world context. You MUST use ONLY these exact values: ${genreExamples}. Use lowercase values exactly as shown. TEMPORAL GUIDELINES: Settings in 2000s-present = "modern", settings before 2000 (1990s and earlier) = "historical", futuristic = "sci-fi", magical = "fantasy", scary/dark = "horror", crime solving = "mystery", frontier/cowboys = "western", dystopian tech = "cyberpunk", unique themes = "other".`}",
  "description": "A 2-3 sentence description of the world and its unique features. CRITICAL: For realistic settings (anything with years like '1970s' or real jobs like 'Diner Cook'), use completely mundane, realistic language. Describe real equipment, real people, real challenges. NO magical, supernatural, mystical, or fantastical elements whatsoever. Example for 1970s diner: 'A classic roadside diner serving coffee and comfort food to truckers and locals. The grill sizzles with burgers and the jukebox plays classic rock while waitresses navigate busy lunch rushes and difficult customers.' MUST be completely original with no references to existing media.",
  "attributes": [
    {
      "name": "Attribute Name",
      "description": "What this attribute represents in this world",
      "minValue": 1,
      "maxValue": 10,
      "defaultValue": 5
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "description": "What this skill allows characters to do",
      "difficulty": "easy|medium|hard",
      "category": "skill category"
    }
  ]
}

Generate 4-6 attributes that make sense for this world setting.
Generate 6-10 skills that would be relevant in this world.`;

  if (options.reference) {
    const isSetIn = options.relationship === 'set_within';
    if (isSetIn) {
      prompt += `\nCRITICAL: Attributes and skills must be realistic and appropriate for the actual ${options.reference} setting. Do NOT include magical, supernatural, or fantasy elements unless they actually exist in ${options.reference}. Focus on real-world skills and attributes that characters would actually have in that universe.`;
    } else {
      prompt += `\nMake the world interesting and playable while capturing the essence of ${options.reference}.`;
    }
  } else {
    prompt += `\nFOR REALISTIC SETTINGS (years like '1970s' or jobs like 'Diner Cook'): Attributes and skills must be completely realistic - things like Cooking, Customer Service, Physical Stamina, Communication, etc. NO magical, supernatural, or fantasy elements.
    
FOR FANTASY/SCI-FI SETTINGS: Use appropriate magical or technological elements.

Make the world interesting and playable with concepts appropriate to the setting type.`;
  }

  prompt += `\n\nCRITICAL JSON REQUIREMENTS:
- Return ONLY valid JSON with no additional text, explanations, or markdown
- Ensure all strings are properly escaped and terminated
- Do not truncate the response - complete all JSON fields
- Test your JSON syntax before responding
- If you cannot complete the full response, prioritize the core fields: name, genre, description, attributes, skills`;

  // Retry logic for JSON parsing failures
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Import the AI client for server-side usage
      const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
      const client = createDefaultGeminiClient(apiKey, model);
      
      // Add retry context to prompt for subsequent attempts
      const retryPrompt = attempt > 1 
        ? `${prompt}\n\nIMPORTANT: This is retry attempt ${attempt}/${MAX_RETRIES}. The previous attempt failed due to malformed JSON. Please ensure your response is valid, complete JSON without any truncation or syntax errors.`
        : prompt;
      
      // Generate with AI
      const response = await client.generateContent(retryPrompt);
      
      // Use the existing AI response parser utility
      const parsed = parseAIJsonResponse<Record<string, unknown>>({ content: response.content }, 'Failed to generate world configuration');
      
      // Validate the response has required fields
      validateRequiredFields(parsed, ['name', 'genre', 'description', 'attributes', 'skills'], 'world generation response');
      validateArrayFields(parsed, ['attributes', 'skills'], 'world generation response');
      
      // If we get here, parsing was successful, continue with the rest of the function
      lastError = null;
      
      // Use suggested name if provided and AI didn't use it, otherwise ensure unique name
      let worldName = options.suggestedName || String(parsed.name);
      
      // If the name already exists, add a suffix
      let suffix = 1;
      while (options.existingNames?.includes(worldName)) {
        worldName = `${options.suggestedName || String(parsed.name)} ${suffix}`;
        suffix++;
      }
      
      // Validate and clean attributes
      const attributesArray = parsed.attributes as unknown[];
      const attributes = attributesArray.map((attr: unknown) => {
        const attrObj = attr as Record<string, unknown>;
        const attribute = {
          id: 'temp-id', // Temporary ID for validation
          worldId: 'temp-world-id', // Temporary worldId for validation
          name: String(attrObj.name || 'Unknown Attribute'),
          description: normalizeText(String(attrObj.description || ''), NORM_DESC),
          baseValue: Number(attrObj.defaultValue) || 5,
          minValue: Number(attrObj.minValue) || 1,
          maxValue: Number(attrObj.maxValue) || 10,
          category: String(attrObj.category || 'General')
        };
        
        // Validate the constructed attribute
        const validation = validateWorldAttribute(attribute);
        if (!validation.valid) {
          logger.warn(`AI generated invalid attribute "${attribute.name}":`, validation.errors[0]);
          // Return a safe default attribute
          return { ...DEFAULT_WORLD_ATTRIBUTE };
        }
        
        // Return without temp IDs
        return {
          name: attribute.name,
          description: attribute.description,
          baseValue: attribute.baseValue,
          minValue: attribute.minValue,
          maxValue: attribute.maxValue,
          category: attribute.category
        };
      });
      
      // Validate and clean skills
      const skillsArray = parsed.skills as unknown[];
      const skills = skillsArray.map((skill: unknown) => {
        const skillObj = skill as Record<string, unknown>;
        const skillData = {
          id: 'temp-id', // Temporary ID for validation
          worldId: 'temp-world-id', // Temporary worldId for validation
          name: String(skillObj.name || 'Unknown Skill'),
          description: normalizeText(String(skillObj.description || ''), NORM_DESC),
          difficulty: ['easy', 'medium', 'hard'].includes(skillObj.difficulty as string) ? skillObj.difficulty as 'easy' | 'medium' | 'hard' : 'medium',
          category: (skillObj.category as string) || 'General',
          baseValue: 1,
          minValue: 1,
          maxValue: 5,
        };
        
        // Validate the constructed skill
        const validation = validateWorldSkill(skillData);
        if (!validation.valid) {
          logger.warn(`AI generated invalid skill "${skillData.name}":`, validation.errors[0]);
          // Return a safe default skill
          return { ...DEFAULT_WORLD_SKILL };
        }
        
        // Return without temp IDs
        return {
          name: skillData.name,
          description: skillData.description,
          difficulty: skillData.difficulty,
          category: skillData.category,
          baseValue: skillData.baseValue,
          minValue: skillData.minValue,
          maxValue: skillData.maxValue,
        };
      });
      
      // Ensure settings have proper defaults and validate
      const settings: WorldSettings = {
        maxAttributes: attributes.length,
        maxSkills: skills.length,
        attributePointPool: 30,
        skillPointPool: 50
      };
      
      // Validate the constructed settings
      const settingsValidation = validateWorldSettings(settings);
      if (!settingsValidation.valid) {
        logger.warn('AI generated invalid world settings:', settingsValidation.errors[0]);
        // Use safe default settings
        settings.maxAttributes = Math.max(4, attributes.length);
        settings.maxSkills = Math.max(6, skills.length);
        settings.attributePointPool = 30;
        settings.skillPointPool = 50;
      }
      
      return {
        name: normalizeText(worldName, NORM_NAME),
        genre: normalizeGenre(String(parsed.genre)),
        description: normalizeText(String(parsed.description), NORM_DESC),
        reference: options.reference,
        relationship: options.relationship,
        attributes,
        skills,
        settings
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error during world generation');
      logger.error(`World generation attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);
      
      // If this is not the last attempt, continue to retry
      if (attempt < MAX_RETRIES) {
        continue;
      }
    }
  }
  
  // If we get here, all retries failed
  logger.error('Failed to generate world after all retries:', lastError);
  throw new Error('Failed to generate world configuration. Please try again.');
}
