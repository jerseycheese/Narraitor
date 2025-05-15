import { AIPromptProcessor } from '@/lib/ai/aiPromptProcessor';
import { AttributeSuggestion, SkillSuggestion } from '@/components/WorldCreationWizard/WorldCreationWizard';
import { PromptTemplateManager } from '@/lib/promptTemplates/promptTemplateManager';

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
  linkedAttributeName?: string;
}

interface AIAnalysisResponse {
  attributes: AIAttribute[];
  skills: AISkill[];
}

export async function analyzeWorldDescription(description: string): Promise<WorldAnalysisResult> {
  try {
    const processor = new AIPromptProcessor({
      templateManager: new PromptTemplateManager(),
      config: {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        modelName: 'gemini-pro',
        maxRetries: 3,
        timeout: 30000
      }
    });
    
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
            "linkedAttributeName": "Strength"
          }
        ]
      }
    `;
    
    const response = await processor.processAndSend('world-analysis', { prompt });
    
    // Parse the JSON response
    let analysis: AIAnalysisResponse;
    try {
      analysis = JSON.parse(response.content);
    } catch {
      // Fallback to extract JSON from response if not pure JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    // Transform the response to match our interface
    const attributes: AttributeSuggestion[] = analysis.attributes.map((attr: AIAttribute) => ({
      name: attr.name,
      description: attr.description,
      minValue: attr.minValue || 1,
      maxValue: attr.maxValue || 10,
      category: attr.category,
      accepted: false,
    }));
    
    const skills: SkillSuggestion[] = analysis.skills.map((skill: AISkill) => ({
      name: skill.name,
      description: skill.description,
      difficulty: skill.difficulty || 'medium',
      category: skill.category,
      linkedAttributeName: skill.linkedAttributeName,
      accepted: false,
    }));
    
    return { attributes, skills };
  } catch {
    // Return default suggestions as fallback
    return {
      attributes: [
        { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
        { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, category: 'Mental', accepted: false },
        { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
        { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, category: 'Social', accepted: false },
        { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
        { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', accepted: false },
        { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeName: 'Agility', accepted: false },
        { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
        { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
        { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
        { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeName: 'Strength', accepted: false },
        { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
        { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeName: 'Constitution', accepted: false },
        { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
        { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
        { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Strength', accepted: false },
        { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
      ],
    };
  }
}
