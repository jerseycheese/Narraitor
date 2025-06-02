import { createAIClient } from '@/lib/ai/clientFactory';
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
  'The Office',
  'The Walking Dead',
  'Black Mirror',
  'The Matrix',
  'Mad Max',
  'Westworld',
  'Star Trek',
  'Dune',
  'The Mandalorian',
  'Breaking Bad',
  'True Detective',
  'UHF'
];

// Universe context for accurate generation
interface UniverseContext {
  genre: string;
  description: string;
  techLevel: string;
  setting: string;
}

function getUniverseContext(universe: string): UniverseContext {
  const contexts: Record<string, UniverseContext> = {
    'Game of Thrones': {
      genre: 'Medieval Fantasy',
      description: 'a medieval fantasy world with political intrigue, dragons, and magic',
      techLevel: 'Medieval (swords, castles, no gunpowder)',
      setting: 'Westeros and Essos continents with kingdoms, houses, and ancient magic'
    },
    'Lord of the Rings': {
      genre: 'High Fantasy',
      description: 'a high fantasy world with elves, dwarves, hobbits, wizards, and epic quests',
      techLevel: 'Medieval/Ancient (no advanced technology)',
      setting: 'Middle-earth with different races, magical rings, and dark lords'
    },
    'Star Wars': {
      genre: 'Space Opera',
      description: 'a space opera with the Force, Jedi, Sith, space travel, and galactic empires',
      techLevel: 'Advanced sci-fi (lightsabers, starships, droids)',
      setting: 'Galaxy far, far away with multiple planets and species'
    },
    'The Office': {
      genre: 'Modern Workplace Comedy',
      description: 'a modern workplace mockumentary about office life and mundane corporate culture',
      techLevel: 'Modern day (computers, phones, office equipment)',
      setting: 'Contemporary office building in Scranton, Pennsylvania'
    },
    'Breaking Bad': {
      genre: 'Modern Crime Drama',
      description: 'a modern crime drama about drug manufacturing and criminal underworld',
      techLevel: 'Modern day (cars, phones, chemistry equipment)',
      setting: 'Contemporary Albuquerque, New Mexico'
    },
    'The Matrix': {
      genre: 'Cyberpunk Sci-Fi',
      description: 'a cyberpunk world where reality is a computer simulation and humans fight machines',
      techLevel: 'Near-future/cyberpunk (advanced computers, virtual reality)',
      setting: 'Post-apocalyptic real world and simulated 1990s reality'
    },
    'Mad Max': {
      genre: 'Post-Apocalyptic',
      description: 'a post-apocalyptic wasteland with vehicular combat and resource scarcity',
      techLevel: 'Post-apocalyptic (modified vehicles, scavenged tech)',
      setting: 'Australian wasteland after societal collapse'
    },
    'Star Trek': {
      genre: 'Optimistic Sci-Fi',
      description: 'an optimistic sci-fi future with space exploration, alien species, and advanced technology',
      techLevel: 'Far future (transporters, warp drive, replicators)',
      setting: 'Federation space with multiple planets and species'
    },
    'Westworld': {
      genre: 'Sci-Fi Western',
      description: 'a sci-fi western with android hosts in a theme park and AI consciousness',
      techLevel: 'Near future (advanced AI, robotics) in Wild West setting',
      setting: 'Western theme park with android hosts and human guests'
    },
    'The Walking Dead': {
      genre: 'Zombie Apocalypse',
      description: 'a zombie apocalypse survival story with undead walkers and human communities',
      techLevel: 'Modern day (limited resources, scavenged equipment)',
      setting: 'Post-zombie-apocalypse Georgia and surrounding areas'
    },
    'Black Mirror': {
      genre: 'Dark Sci-Fi Anthology',
      description: 'a dark sci-fi anthology exploring technology\'s impact on society and human behavior',
      techLevel: 'Near future (advanced social media, VR, AI)',
      setting: 'Various near-future settings with dystopian technology'
    },
    'Stranger Things': {
      genre: '1980s Supernatural',
      description: 'a 1980s supernatural story with parallel dimensions, government experiments, and monsters',
      techLevel: '1980s (walkie-talkies, arcade games, no internet)',
      setting: 'Small town Hawkins, Indiana in the 1980s'
    }
  };

  return contexts[universe] || {
    genre: 'Unknown',
    description: 'an unknown fictional universe',
    techLevel: 'Unspecified',
    setting: 'Unspecified setting'
  };
}

/**
 * Unified world generation function
 */
export async function generateWorld(options: WorldGenerationOptions): Promise<GeneratedWorldData> {
  // Always use AI generation, but with TV/movie inspiration
  return generateWithAI(options);
}

/**
 * Generate world using AI
 */
async function generateWithAI(options: WorldGenerationOptions): Promise<GeneratedWorldData> {
  const client = createAIClient();
  
  // If no reference provided, pick a random TV/movie universe
  const reference = options.reference || TV_MOVIE_UNIVERSES[Math.floor(Math.random() * TV_MOVIE_UNIVERSES.length)];
  
  // Determine if this world should be set in the reference universe or just inspired by it
  const isSetIn = options.relationship === 'set_in';
  
  // Get universe-specific context for better generation
  const universeContext = getUniverseContext(reference);
  
  const prompt = `Generate a complete world configuration for a text-based RPG ${isSetIn ? `set within the ${reference} universe` : `inspired by the ${reference} universe`}.

UNIVERSE CONTEXT: ${reference} is ${universeContext.description}

${isSetIn 
  ? `IMPORTANT: Create a world that exists WITHIN the ${reference} universe. This should be a specific location, region, or area that fits perfectly within the established ${reference} setting. The world MUST:
     - Use the EXACT same genre/theme as ${reference} (${universeContext.genre})
     - Follow the established technology level, time period, and rules of ${reference}
     - Use appropriate ${reference} terminology, locations, species, and lore
     - Feel like it could actually exist within the ${reference} storyline
     - NOT change the fundamental nature or genre of ${reference}`
  : `IMPORTANT: Create an ORIGINAL world that captures the essence, themes, and feeling of ${reference}, but is NOT a direct copy. The world should be inspired by ${reference} but have its own unique name, locations, and lore.`
}

${options.suggestedName ? `\nThe world should be named: "${options.suggestedName}"` : ''}
${options.existingNames?.length ? `\nExisting worlds to avoid duplicating: ${options.existingNames.join(', ')}` : ''}

Provide a JSON response with this exact structure:
{
  "name": "${isSetIn ? `A name that fits within the ${reference} universe` : 'A unique name for this world (not just the reference name)'}",
  "theme": "${isSetIn ? universeContext.genre : 'The genre/setting that captures the essence of ' + reference}",
  "description": "A 2-3 sentence description of the world and its unique features. ${isSetIn ? `MUST clearly establish that this is part of the ${reference} universe.` : `MUST mention that this world is inspired by ${reference}.`}",
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

Generate 4-6 attributes that make sense for this world setting and the ${reference} universe.
Generate 6-10 skills that would be relevant in this world and appropriate for the ${universeContext.techLevel} technology level.
${isSetIn ? `Make sure all attributes and skills fit perfectly within the ${reference} universe and its established rules/lore.` : `Create attributes and skills that capture the feeling of ${reference} but in your original world.`}
Make the world interesting and playable while staying true to the source material.

IMPORTANT: The response must be valid JSON only, with no additional text or formatting.`;

  try {
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
  return generateWithAI({ method: 'ai', reference: randomReference, relationship: 'based_on' });
}

export async function generateAIWorld(
  worldReference: string,
  worldRelationship: 'based_on' | 'set_in',
  existingWorldNames: string[],
  suggestedName?: string
): Promise<GeneratedWorldData> {
  return generateWithAI({
    method: 'ai',
    reference: worldReference,
    relationship: worldRelationship,
    existingNames: existingWorldNames,
    suggestedName
  });
}