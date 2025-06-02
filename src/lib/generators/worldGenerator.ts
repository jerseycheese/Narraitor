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
  
  const prompt = `Generate a complete world configuration for a text-based RPG ${isSetIn ? `set within the ${reference} universe` : `inspired by the ${reference} universe`}.

${isSetIn 
  ? `IMPORTANT: Create a world that exists WITHIN the ${reference} universe. This should be a specific location, region, planet, or area that fits within the established ${reference} lore and setting. Use existing ${reference} terminology, species, magic systems, technology, etc. where appropriate.`
  : `IMPORTANT: Create an ORIGINAL world that captures the essence, themes, and feeling of ${reference}, but is NOT a direct copy. The world should be inspired by ${reference} but have its own unique name, locations, and lore.`
}

${options.suggestedName ? `\nThe world should be named: "${options.suggestedName}"` : ''}
${options.existingNames?.length ? `\nExisting worlds to avoid duplicating: ${options.existingNames.join(', ')}` : ''}

Provide a JSON response with this exact structure:
{
  "name": "${isSetIn ? `A name that fits within the ${reference} universe` : 'A unique name for this world (not just the reference name)'}",
  "theme": "The genre/setting (e.g., Fantasy, Sci-Fi, Historical, Modern, Post-Apocalyptic)",
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

Generate 4-6 attributes that make sense for this world setting.
Generate 6-10 skills that would be relevant in this world.
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