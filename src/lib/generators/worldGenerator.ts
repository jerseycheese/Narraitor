import { WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';

export interface GeneratedWorldData {
  name: string;
  theme: string;
  description: string;
  attributes: Array<Omit<WorldAttribute, 'id' | 'worldId'>>;
  skills: Array<Omit<WorldSkill, 'id' | 'worldId'>>;
  settings: WorldSettings;
}

export type WorldGenerationMethod = 'template' | 'ai';

export interface WorldGenerationOptions {
  method: WorldGenerationMethod;
  reference?: string; // For AI generation or specific template selection
  relationship?: 'based_on' | 'set_in'; // Whether world is set in or based on the reference
  existingNames?: string[];
  suggestedName?: string;
}

// List of TV/movie universes for AI inspiration
export const TV_MOVIE_UNIVERSES = [
  'Game of Thrones',
  'Lord of the Rings',
  'Star Wars',
  'Twin Peaks',
  'Stranger Things',
  'Deadwood',
  'The Witcher',
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

// Canonical themes for known universes (for "set in" worlds)
const CANONICAL_THEMES: Record<string, string> = {
  'Star Wars': 'Space Opera',
  'The Mandalorian': 'Space Opera',
  'Star Trek': 'Science Fiction',
  'Dune': 'Science Fiction',
  'The Matrix': 'Cyberpunk',
  'Black Mirror': 'Dystopian Sci-Fi',
  'Westworld': 'Western Sci-Fi',
  'Mad Max': 'Post-Apocalyptic',
  'The Walking Dead': 'Post-Apocalyptic Horror',
  'Game of Thrones': 'Medieval Fantasy',
  'Lord of the Rings': 'High Fantasy',
  'The Witcher': 'Dark Fantasy',
  'Stranger Things': 'Supernatural Horror',
  'Twin Peaks': 'Supernatural Mystery',
  'Deadwood': 'Western',
  'Breaking Bad': 'Crime Drama',
  'True Detective': 'Crime Thriller'
};

/**
 * Get the canonical theme for a known universe
 */
function getCanonicalTheme(reference: string): string {
  // Check for exact match first
  if (CANONICAL_THEMES[reference]) {
    return CANONICAL_THEMES[reference];
  }
  
  // Check for partial matches (case insensitive)
  const lowerRef = reference.toLowerCase();
  for (const [universe, theme] of Object.entries(CANONICAL_THEMES)) {
    if (universe.toLowerCase().includes(lowerRef) || lowerRef.includes(universe.toLowerCase())) {
      return theme;
    }
  }
  
  // Fallback based on common patterns
  if (lowerRef.includes('star') && (lowerRef.includes('wars') || lowerRef.includes('trek'))) {
    return 'Science Fiction';
  }
  if (lowerRef.includes('lord') && lowerRef.includes('rings')) {
    return 'High Fantasy';
  }
  if (lowerRef.includes('game') && lowerRef.includes('thrones')) {
    return 'Medieval Fantasy';
  }
  
  // Generic fallback
  return 'Fantasy';
}

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
    prompt = `Generate a complete world configuration for a text-based RPG with a completely original setting.

IMPORTANT: Create a COMPLETELY ORIGINAL world from your imagination. Do not base it on any existing fictional universe, TV show, movie, or book. The world should have:
- Unique name, geography, and history
- Original cultures, societies, and conflicts
- Creative magic systems, technology, or supernatural elements
- Fresh themes and concepts not directly borrowed from existing media
- Interesting locations and environments that feel new and engaging`
  } else {
    // World with reference (inspired by or set within)
    const reference = options.reference!;
    const isSetIn = options.relationship === 'set_in';
    
    // Get canonical theme for "set in" worlds
    const canonicalTheme = getCanonicalTheme(reference);
    const themeInstruction = isSetIn 
      ? `The theme MUST be "${canonicalTheme}" to match the ${reference} universe.`
      : `Choose an appropriate theme that captures the essence of ${reference}.`;
    
    if (isSetIn) {
      console.log(`[WorldGenerator] "Set in" world for ${reference} - canonical theme: ${canonicalTheme}`);
    }
    
    prompt = `Generate a complete world configuration for a text-based RPG ${isSetIn ? `set within the ${reference} universe` : `inspired by the ${reference} universe`}.

${isSetIn 
  ? `IMPORTANT: Create a world that exists WITHIN the ${reference} universe. This should be a specific location, region, planet, or area that fits within the established ${reference} lore and setting. Use existing ${reference} terminology, species, magic systems, technology, etc. where appropriate. ${themeInstruction}`
  : `IMPORTANT: Create an ORIGINAL world that captures the essence, themes, and feeling of ${reference}, but is NOT a direct copy. The world should be inspired by ${reference} but have its own unique name, locations, and lore. ${themeInstruction}`
}`
  }

  // Add common constraints
  if (options.suggestedName) {
    prompt += `\n\nThe world should be named: "${options.suggestedName}"`;
  }
  if (options.existingNames?.length) {
    prompt += `\n\nExisting worlds to avoid duplicating: ${options.existingNames.join(', ')}`;
  }

  // Add creative naming guidance based on prompt content
  const themeHint = prompt.toLowerCase();
  let namingGuidance = '';
  
  if (themeHint.includes('fantasy')) {
    namingGuidance = `
- Use Celtic, Norse, or other cultural linguistics (e.g., "Vryndaal", "Korvathia", "Zhengara")
- Combine natural elements creatively (e.g., "Thornspire", "Mistholm", "Dragonmere")
- Use abstract concepts (e.g., "The Sundering", "Whisperlands", "Evermoon")`;
  } else if (themeHint.includes('sci-fi') || themeHint.includes('cyberpunk')) {
    namingGuidance = `
- Use technical/scientific terms (e.g., "Nexus Prime", "Quantum Gate", "Neural Collective")
- Combine numbers/codes (e.g., "Sector 7", "Alpha Station", "Grid 2049")
- Use corporate/futuristic names (e.g., "Neo Singapore", "CyberCore City", "Titanfall Industries")`;
  } else if (themeHint.includes('western')) {
    namingGuidance = `
- Use frontier/geographic names (e.g., "Copper Canyon", "Deadwater Gulch", "Sunset Ridge")
- Historical American names (e.g., "Fort Meridian", "Silver Creek", "Tombstone Valley")`;
  } else if (themeHint.includes('horror')) {
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
  "theme": "${options.relationship === 'set_in' && options.reference ? getCanonicalTheme(options.reference) : 'The genre/setting (e.g., Fantasy, Sci-Fi, Historical, Modern, Post-Apocalyptic)'}",
  "description": "A 2-3 sentence description of the world and its unique features`;
  
  if (options.reference) {
    const isSetIn = options.relationship === 'set_in';
    prompt += isSetIn 
      ? `. MUST clearly establish that this is part of the ${options.reference} universe."`
      : `. MUST mention that this world is inspired by ${options.reference}."`;
  } else {
    prompt += `. MUST be completely original with no references to existing media."`;
  }
  
  prompt += `,
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
    prompt += `\nMake the world interesting and playable while staying true to the source material.`;
  } else {
    prompt += `\nMake the world interesting and playable with completely original concepts.`;
  }

  prompt += `\n\nIMPORTANT: The response must be valid JSON only, with no additional text or formatting.`;

  try {
    // Import the AI client for server-side usage
    const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
    const client = createDefaultGeminiClient();
    
    // Generate with AI
    const response = await client.generateContent(prompt);
    const text = response.content.trim();
    
    // Clean up the response - remove any markdown formatting
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText);
    
    // Validate the response has required fields
    if (!parsed.name || !parsed.theme || !parsed.description || !parsed.attributes || !parsed.skills) {
      throw new Error('Generated world is missing required fields');
    }
    
    // Use suggested name if provided and AI didn't use it, otherwise ensure unique name
    let worldName = options.suggestedName || parsed.name;
    
    // If the name already exists, add a suffix
    let suffix = 1;
    while (options.existingNames?.includes(worldName)) {
      worldName = `${options.suggestedName || parsed.name} ${suffix}`;
      suffix++;
    }
    
    // Validate and clean attributes
    const attributes = parsed.attributes.map((attr: unknown) => {
      const attrObj = attr as Record<string, unknown>;
      return {
        name: String(attrObj.name || 'Unknown Attribute'),
        description: String(attrObj.description || ''),
        baseValue: Number(attrObj.defaultValue) || 5,
        minValue: Number(attrObj.minValue) || 1,
        maxValue: Number(attrObj.maxValue) || 10,
        category: attrObj.category || 'General'
      };
    });
    
    // Validate and clean skills
    const skills = parsed.skills.map((skill: unknown) => {
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
      theme: parsed.theme,
      description: parsed.description,
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