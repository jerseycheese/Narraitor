// src/lib/ai/templatePrompts.ts

/**
 * AI prompt templates for world template generation
 */

export interface TemplateGenerationContext {
  userInput?: string;
  genres?: string[];
  type: 'inspired-by' | 'genre-mix' | 'surprise-me';
}

export const generateWorldTemplatePrompt = (context: TemplateGenerationContext): string => {
  const basePrompt = `You are a creative world-building assistant. Generate a world template that provides structure but remains fully editable. The world should be cohesive and engaging.

Response must be valid JSON in this exact format:
{
  "name": "World Name",
  "description": "Brief world description (2-3 sentences)",
  "genre": "Primary genre/theme",
  "attributes": [
    {"name": "Attribute Name", "baseValue": 50, "minValue": 0, "maxValue": 100, "category": "Physical"}
  ],
  "skills": [
    {"name": "Skill Name", "baseValue": 25, "minValue": 0, "maxValue": 100, "difficulty": "moderate", "category": "Combat"}
  ],
  "explanation": "Brief explanation of why these attributes/skills were suggested for this world"
}

IMPORTANT: Include 4-6 attributes and 6-8 skills. Use difficulty levels: "trivial", "easy", "moderate", "hard", "extreme".
`;

  switch (context.type) {
    case 'inspired-by':
      return basePrompt + `
Create a world inspired by: "${context.userInput}"
Make it creative and unique while drawing clear inspiration from the given concept.`;

    case 'genre-mix':
      return basePrompt + `
Create a world that seamlessly blends these genres: ${context.genres?.join(' + ')}
Ensure the combination feels natural and cohesive, not forced.`;

    case 'surprise-me':
      return basePrompt + `
Create a completely unexpected and unique world. Be creative with genre combinations, settings, or concepts.
Aim for something the user wouldn't typically think of but would find intriguing.`;

    default:
      return basePrompt;
  }
};