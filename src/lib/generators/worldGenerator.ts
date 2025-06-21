import { WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';
import { parseAIJsonResponse, validateRequiredFields, validateArrayFields } from '@/lib/utils/aiResponseParser';

export interface GeneratedWorldData {
  name: string;
  genre: string;
  description: string;
  attributes: Array<Omit<WorldAttribute, 'id' | 'worldId'>>;
  skills: Array<Omit<WorldSkill, 'id' | 'worldId'>>;
  settings: WorldSettings;
}

export type WorldGenerationMethod = 'template' | 'ai';

export interface WorldGenerationOptions {
  method: WorldGenerationMethod;
  reference?: string; // For AI generation or specific template selection
  relationship?: 'inspired_by' | 'set_within'; // Whether world is inspired by or set within the reference
  existingNames?: string[];
  suggestedName?: string;
  genre?: string; // User-selected genre (overrides AI-generated genre)
  additionalContext?: string; // Additional user-provided context for original worlds
}

// List of TV/movie universes for AI inspiration
export const TV_MOVIE_UNIVERSES = [
  'Game of Thrones',
  'Lord of the Rings',
  'Star Wars',
  'Twin Peaks',
  'Stranger Things',
  'Deadwood',
  'The Walking Dead',
  'Black Mirror',
  'The Matrix',
  'Mad Max',
  'Westworld',
  'Star Trek',
  'Dune',
  'The Mandalorian',
  'Breaking Bad',
  'True Detective'
];


/**
 * Unified world generation function
 */
export async function generateWorld(options: WorldGenerationOptions): Promise<GeneratedWorldData> {
  // Always use AI generation, but with TV/movie inspiration
  return generateWithAI(options);
}

/**
 * Generate world using AI through secure API
 */
async function generateWithAI(options: WorldGenerationOptions): Promise<GeneratedWorldData> {
  // Handle different world generation types
  let prompt: string;
  
  if (!options.reference && !options.relationship) {
    // Completely original world
    const genreInstruction = options.genre 
      ? `REQUIRED GENRE: The world MUST be in the "${options.genre}" genre. All world elements, themes, conflicts, and atmosphere must align with this genre.`
      : `IMPORTANT: Create a world based on the suggested name and setting context. Analyze the suggested name for time period and setting clues:

FOR REALISTIC SETTINGS (anything mentioning years like "1970s", "1980s", "1990s", or real-world jobs like "Diner Cook", "Office Worker", "Taxi Driver"):
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

  prompt += `\n\nIMPORTANT: Create a UNIQUE and CREATIVE world name. Avoid overused fantasy names like "Aethelgard", "Eldoria", "Avalon", "Mystara", "Drakmoor", etc. Consider:${namingGuidance}
- Avoid generic patterns like "[Adjective][Place]" (e.g., "Darklands", "Brightshire")

Provide a JSON response with this exact structure:
{
  "name": "A creative, unique name for this world (avoid common fantasy tropes)",
  "genre": "${options.genre ? `"${options.genre}" (USER SPECIFIED - use this exactly)` : options.relationship === 'set_within' && options.reference ? `The ACTUAL genre of ${options.reference}. CRITICAL: You MUST identify and use the correct genre from these options: Fantasy, Sci-Fi, Modern, Historical, Post-Apocalyptic, Cyberpunk, Western, or Other. Examples: The Office = "Modern", Star Wars = "Sci-Fi", Lord of the Rings = "Fantasy", Breaking Bad = "Modern", The Walking Dead = "Post-Apocalyptic", Deadwood = "Western". NEVER default to Fantasy unless the source material is actually fantasy. For contemporary settings like sitcoms, dramas, or workplace comedies, use "Modern".` : 'The appropriate genre/setting based on the suggested name and context. Choose from: Fantasy, Sci-Fi, Modern, Historical, Post-Apocalyptic, Cyberpunk, Western, Other. CRITICAL: Analyze the suggested name for clues - "1990s" suggests Historical, "Diner Cook" suggests Modern, "Medieval" suggests Historical, "Space Station" suggests Sci-Fi. Match the genre to what the name actually indicates.'}",
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

  try {
    // Import the AI client for server-side usage
    const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
    const client = createDefaultGeminiClient();
    
    // Generate with AI
    const response = await client.generateContent(prompt);
    
    // Use the existing AI response parser utility
    const parsed = parseAIJsonResponse<Record<string, unknown>>({ content: response.content }, 'Failed to generate world configuration');
    
    // Validate the response has required fields
    validateRequiredFields(parsed, ['name', 'genre', 'description', 'attributes', 'skills'], 'world generation response');
    validateArrayFields(parsed, ['attributes', 'skills'], 'world generation response');
    
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
      return {
        name: String(attrObj.name || 'Unknown Attribute'),
        description: String(attrObj.description || ''),
        baseValue: Number(attrObj.defaultValue) || 5,
        minValue: Number(attrObj.minValue) || 1,
        maxValue: Number(attrObj.maxValue) || 10,
        category: String(attrObj.category || 'General')
      };
    });
    
    // Validate and clean skills
    const skillsArray = parsed.skills as unknown[];
    const skills = skillsArray.map((skill: unknown) => {
      const skillObj = skill as Record<string, unknown>;
      return {
        name: String(skillObj.name || 'Unknown Skill'),
        description: String(skillObj.description || ''),
        difficulty: ['easy', 'medium', 'hard'].includes(skillObj.difficulty as string) ? skillObj.difficulty as 'easy' | 'medium' | 'hard' : 'medium',
        category: (skillObj.category as string) || 'General',
        baseValue: 1,
        minValue: 1,
        maxValue: 5,
      };
    });
    
    // Ensure settings have proper defaults
    const settings: WorldSettings = {
      maxAttributes: attributes.length,
      maxSkills: skills.length,
      attributePointPool: 30,
      skillPointPool: 50
    };
    
    return {
      name: worldName,
      genre: String(parsed.genre),
      description: String(parsed.description),
      attributes,
      skills,
      settings
    };
  } catch (error) {
    console.error('Failed to generate world:', error);
    throw new Error('Failed to generate world configuration. Please try again.');
  }
}

// Convenience functions for backward compatibility
export async function generateTestWorld(): Promise<GeneratedWorldData> {
  // Pick a random TV/movie universe for test generation
  const randomReference = TV_MOVIE_UNIVERSES[Math.floor(Math.random() * TV_MOVIE_UNIVERSES.length)];
  return generateWithAI({ method: 'ai', reference: randomReference });
}

export async function generateAIWorld(
  worldReference: string,
  existingWorldNames: string[],
  suggestedName?: string
): Promise<GeneratedWorldData> {
  return generateWithAI({
    method: 'ai',
    reference: worldReference,
    existingNames: existingWorldNames,
    suggestedName
  });
}
