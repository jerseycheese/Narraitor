import { createAIClient } from './clientFactory';
import { WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';

export interface GeneratedWorldData {
  name: string;
  theme: string;
  description: string;
  attributes: Omit<WorldAttribute, 'id'>[];
  skills: Omit<WorldSkill, 'id'>[];
  settings: WorldSettings;
}

/**
 * Generates a complete world configuration based on a fictional or non-fictional world reference
 */
export async function generateWorld(
  worldReference: string,
  existingWorldNames: string[],
  suggestedName?: string
): Promise<GeneratedWorldData> {
  const client = createAIClient();
  
  const prompt = `Generate a complete world configuration for a text-based RPG based on "${worldReference}".
${suggestedName ? `\nThe world should be named: "${suggestedName}"` : ''}
${existingWorldNames.length > 0 ? `\nExisting worlds to avoid duplicating: ${existingWorldNames.join(', ')}` : ''}

Provide a JSON response with this exact structure:
{
  "name": "A unique name for this world (not just the reference name)",
  "theme": "The genre/setting (e.g., Fantasy, Sci-Fi, Historical, Modern, Post-Apocalyptic)",
  "description": "A 2-3 sentence description of the world and its unique features",
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
      "associatedAttributeId": "will be set later"
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
    let worldName = suggestedName || parsed.name;
    
    // If the name already exists, add a suffix
    let suffix = 1;
    while (existingWorldNames.includes(worldName)) {
      worldName = `${suggestedName || parsed.name} ${suffix}`;
      suffix++;
    }
    
    // Validate and clean attributes
    const attributes = parsed.attributes.map((attr: unknown) => {
      const attrObj = attr as Record<string, unknown>;
      return {
        name: String(attrObj.name || 'Unknown Attribute'),
        description: String(attrObj.description || ''),
        minValue: Number(attrObj.minValue) || 1,
        maxValue: Number(attrObj.maxValue) || 10,
        defaultValue: Number(attrObj.defaultValue) || 5
      };
    });
    
    // Validate and clean skills
    const skills = parsed.skills.map((skill: unknown) => {
      const skillObj = skill as Record<string, unknown>;
      return {
        name: String(skillObj.name || 'Unknown Skill'),
        description: String(skillObj.description || ''),
        difficulty: ['easy', 'medium', 'hard'].includes(skillObj.difficulty as string) ? skillObj.difficulty as 'easy' | 'medium' | 'hard' : 'medium',
        associatedAttributeId: '' // Will be set when creating the world
      };
    });
    
    // Ensure settings have proper defaults based on WorldSettings interface
    const settings: WorldSettings = {
      maxAttributes: attributes.length,
      maxSkills: skills.length,
      attributePointPool: 30, // Default point pool
      skillPointPool: 50 // Default skill point pool
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