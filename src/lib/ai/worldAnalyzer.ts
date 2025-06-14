import { GeminiClient } from '@/lib/ai/geminiClient';
import { getAIConfig, getGenerationConfig, getSafetySettings } from '@/lib/ai/config';
import { AttributeSuggestion, SkillSuggestion } from '@/components/WorldCreationWizard/WorldCreationWizard';

export interface WorldAnalysisResult {
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
}

interface AIAttribute {
  name: string;
  description: string;
  minValue?: number;
  maxValue?: number;
  category?: string;
}

interface AISkill {
  name: string;
  description: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  linkedAttributeNames?: string[];
}

interface AIAnalysisResponse {
  attributes: AIAttribute[];
  skills: AISkill[];
}

export async function analyzeWorldDescription(description: string): Promise<WorldAnalysisResult> {
  console.log('analyzeWorldDescription called with:', description.substring(0, 50) + '...');
  
  try {
    const config = getAIConfig();
    console.log('Using AI config:', { modelName: config.modelName, timeout: config.timeout });
    
    if (!config.geminiApiKey) {
      throw new Error('API key is not configured');
    }
    
    const prompt = `
      Analyze the following world description and suggest appropriate attributes and skills for a role-playing game.

      World Description:
      ${description}

      Please provide:
      1. 6 core attributes that would be important in this world
      2. 12 skills that characters in this world would need
      
      For each attribute, include:
      - Name
      - Description (one sentence)
      - Minimum value (typically 1)
      - Maximum value (typically 10)
      - Category (if applicable, like Physical, Mental, Social)
      
      For each skill, include:
      - Name
      - Description (one sentence)
      - Difficulty level (easy, medium, or hard)
      - Category (if applicable, like Combat, Social, Technical)
      - Related attribute name (if any)
      
      Format your response as JSON following this structure:
      {
        "attributes": [
          {
            "name": "Strength",
            "description": "Physical power and endurance",
            "minValue": 1,
            "maxValue": 10,
            "category": "Physical"
          }
        ],
        "skills": [
          {
            "name": "Swordsmanship",
            "description": "Skill with bladed weapons",
            "difficulty": "medium",
            "category": "Combat",
            "linkedAttributeNames": ["Strength"]
          }
        ]
      }
    `;
    
    console.log('Calling AI service directly...');
    // Call the AI service directly with proper configuration
    const client = new GeminiClient({
      apiKey: config.geminiApiKey,
      modelName: config.modelName,
      maxRetries: config.maxRetries,
      timeout: config.timeout,
      generationConfig: getGenerationConfig(),
      safetySettings: getSafetySettings()
    });
    
    // Add a small delay to ensure loading overlay appears
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await client.generateContent(prompt);
    console.log('Response received:', response);
    
    // Parse the JSON response
    let analysis: AIAnalysisResponse;
    try {
      // First try to parse directly
      analysis = JSON.parse(response.content);
      console.log('Parsed analysis:', analysis);
    } catch {
      console.log('Initial parse failed, attempting to extract JSON from markdown...');
      
      // Fallback to extract JSON from response if not pure JSON
      // Look for JSON wrapped in markdown code blocks
      const codeBlockMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        analysis = JSON.parse(codeBlockMatch[1]);
        console.log('Successfully parsed from code block');
      } else {
        // Look for JSON object anywhere in the content
        // Use a more flexible regex that allows nested objects
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON using regex');
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }
    }
    
    // Transform the response to match our interface
    const attributes: AttributeSuggestion[] = analysis.attributes.map((attr: AIAttribute) => ({
      name: attr.name,
      description: attr.description,
      minValue: attr.minValue || 1,
      maxValue: attr.maxValue || 10,
      baseValue: Math.floor(((attr.minValue || 1) + (attr.maxValue || 10)) / 2), // Default value in the middle
      category: attr.category,
      accepted: false, // Default to not accepted, user must explicitly select
    }));
    
    const skills: SkillSuggestion[] = analysis.skills.map((skill: AISkill) => ({
      name: skill.name,
      description: skill.description,
      difficulty: skill.difficulty || 'medium',
      category: skill.category,
      linkedAttributeNames: skill.linkedAttributeNames,
      accepted: false, // Default to not accepted, user must explicitly select
      baseValue: 5, // Default value
      minValue: 1, // Fixed min for MVP
      maxValue: 10, // Fixed max for MVP
    }));
    
    return { attributes, skills };
  } catch (error) {
    console.error('Error in analyzeWorldDescription:', error);
    // Return default suggestions as fallback
    return {
      attributes: [
        { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: false },
        { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: false },
        { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: false },
        { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, baseValue: 4, category: 'Social', accepted: false },
        { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: false },
        { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeNames: ['Strength'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeNames: ['Agility'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeNames: ['Strength'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeNames: ['Constitution'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Strength'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
      ],
    };
  }
}
