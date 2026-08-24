import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { getAIConfig, resolveEffectiveGeminiKey } from '@/lib/ai/config';
import { AttributeSuggestion, SkillSuggestion } from '@/components/WorldCreationWizard/WorldCreationWizard';
import { truncate } from '../utils';
import { logger } from '../utils/logger';
import { parseJsonFromLLM } from './parseJSON';
import type { ProviderCredential } from './providers/types';

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

export async function analyzeWorldDescription(
  description: string,
  credential?: ProviderCredential | null,
  model?: string | null
): Promise<WorldAnalysisResult> {
  logger.debug('analyzeWorldDescription called with:', truncate(description, 100));

  try {
    const config = getAIConfig();
    const effectiveKey =
      credential && typeof credential === 'object'
        ? credential.apiKey
        : resolveEffectiveGeminiKey(credential);
    const effectiveModel =
      credential && typeof credential === 'object' ? credential.model : model ?? config.modelName;
    logger.debug('Using AI config:', {
      modelName: effectiveModel,
      timeout: config.timeout,
      hasApiKey: !!effectiveKey
    });

    if (!effectiveKey) {
      logger.error('API key is not configured - check GEMINI_API_KEY environment variable');
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
      - Description (one sentence explaining how it's relevant to stories/gameplay in THIS specific world)
      - Minimum value (typically 1)
      - Maximum value (typically 10)
      - Category (if applicable, like Physical, Mental, Social)

      For each skill, include:
      - Name
      - Description (one sentence explaining how it's relevant to stories/gameplay in THIS specific world)
      - Difficulty level (easy, medium, or hard)
      - Category (if applicable, like Combat, Social, Technical)
      - Related attribute name (if any)
      
      Format your response as JSON following this structure:
      {
        "attributes": [
          {
            "name": "Strength",
            "description": "Essential for surviving harsh wilderness conditions and manual labor in frontier settlements",
            "minValue": 1,
            "maxValue": 10,
            "category": "Physical"
          }
        ],
        "skills": [
          {
            "name": "Swordsmanship",
            "description": "Crucial for dueling rivals and defending honor in this sword-centric culture",
            "difficulty": "medium",
            "category": "Combat",
            "linkedAttributeNames": ["Strength"]
          }
        ]
      }
    `;
    
    logger.debug('Calling AI service directly...');
    const client = createDefaultGeminiClient(credential, model);
    
    logger.debug('Making AI request...');
    const response = await client.generateContent(prompt);
    logger.debug('Response received, length:', response.content.length);
    logger.debug('Response content preview:', truncate(response.content, 200));
    
    // Parse the JSON response
    let analysis: AIAnalysisResponse;
    try {
      // First try to parse directly
      analysis = JSON.parse(response.content);
      logger.debug('Parsed analysis:', analysis);
    } catch {
      logger.debug('Initial parse failed, extracting JSON from fences/prose...');
      // Strips ```json fences and recovers the embedded object in one step.
      analysis = parseJsonFromLLM<AIAnalysisResponse>(response.content);
      logger.debug('Successfully extracted JSON from response');
    }
    
    // Transform the response to match our interface
    const attributes: AttributeSuggestion[] = analysis.attributes.map((attr: AIAttribute) => ({
      name: attr.name,
      description: attr.description,
      minValue: attr.minValue || 1,
      maxValue: attr.maxValue || 10,
      baseValue: Math.floor(((attr.minValue || 1) + (attr.maxValue || 10)) / 2), // Default value in the middle
      category: attr.category,
      accepted: true, // Pre-accept AI suggestions for user convenience
    }));
    
    const skills: SkillSuggestion[] = analysis.skills.map((skill: AISkill) => ({
      name: skill.name,
      description: skill.description,
      difficulty: skill.difficulty || 'medium',
      category: skill.category,
      linkedAttributeNames: skill.linkedAttributeNames,
      accepted: true, // Pre-accept AI suggestions for user convenience
      baseValue: 5, // Default value
      minValue: 1, // Fixed min for MVP
      maxValue: 10, // Fixed max for MVP
    }));
    
    return { attributes, skills };
  } catch (error) {
    logger.error('Error in analyzeWorldDescription:', error);
    // Return default suggestions as fallback
    return {
      attributes: [
        { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
        { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: true },
        { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
        { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, baseValue: 4, category: 'Social', accepted: true },
        { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
        { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
      ],
      skills: [
        { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeNames: ['Strength'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeNames: ['Agility'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeNames: ['Strength'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeNames: ['Constitution'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeNames: ['Strength'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeNames: ['Charisma'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      ],
    };
  }
}
