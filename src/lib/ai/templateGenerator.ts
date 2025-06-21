// src/lib/ai/templateGenerator.ts

import { AIClient } from './types';
import { generateWorldTemplatePrompt, TemplateGenerationContext } from './templatePrompts';
import { World } from '@/types/world.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { parseAIJsonResponse, validateRequiredFields, validateArrayFields, handleAIRequest } from '@/lib/utils/aiResponseParser';

export interface WorldTemplate {
  name: string;
  description: string;
  genre: string;
  attributes: Array<{
    name: string;
    description?: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    category: string;
  }>;
  skills: Array<{
    name: string;
    description?: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    difficulty: SkillDifficulty;
    category: string;
  }>;
  explanation: string;
}

export class TemplateGenerator {
  constructor(private geminiClient: AIClient) {}

  async generateWorldTemplate(context: TemplateGenerationContext): Promise<WorldTemplate> {
    return handleAIRequest(
      () => {
        const prompt = generateWorldTemplatePrompt(context);
        return this.geminiClient.generateContent(prompt);
      },
      (response) => {
        const templateData = parseAIJsonResponse<WorldTemplate>(response, 'Failed to parse world template');
        this.validateTemplate(templateData);
        return templateData;
      }
    );
  }

  validateTemplate(template: unknown): asserts template is WorldTemplate {
    const requiredFields = ['name', 'description', 'genre', 'attributes', 'skills', 'explanation'];
    const arrayFields = ['attributes', 'skills'];
    
    validateRequiredFields(template, requiredFields, 'template structure');
    const templateRecord = template as Record<string, unknown>;
    validateArrayFields(templateRecord, arrayFields, 'template structure');

    // Validate and fix each attribute
    const attributes = (templateRecord.attributes as Record<string, unknown>[]).map((attr, index) => {
      if (!attr.name) {
        throw new Error(`Attribute ${index} missing name`);
      }
      return {
        ...attr,
        baseValue: typeof attr.baseValue === 'number' ? attr.baseValue : 50,
        minValue: typeof attr.minValue === 'number' ? attr.minValue : 0,
        maxValue: typeof attr.maxValue === 'number' ? attr.maxValue : 100,
        category: attr.category || 'General'
      };
    });

    // Validate and fix each skill
    const skills = (templateRecord.skills as Record<string, unknown>[]).map((skill, index) => {
      if (!skill.name) {
        throw new Error(`Skill ${index} missing name`);
      }
      const difficulty = ['easy', 'medium', 'hard'].includes(skill.difficulty as string) 
        ? skill.difficulty as string 
        : 'medium';
      
      return {
        ...skill,
        baseValue: typeof skill.baseValue === 'number' ? skill.baseValue : 40,
        minValue: typeof skill.minValue === 'number' ? skill.minValue : 0,
        maxValue: typeof skill.maxValue === 'number' ? skill.maxValue : 100,
        difficulty,
        category: skill.category || 'General'
      };
    });

    // Update the template with validated data
    templateRecord.attributes = attributes;
    templateRecord.skills = skills;
  }

  convertTemplateToWorld(template: WorldTemplate): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: template.name,
      description: template.description,
      genre: template.genre,
      attributes: template.attributes.map((attr, index) => ({
        id: `attr-${index}`,
        worldId: '', // Will be set when world is created
        name: attr.name,
        description: attr.description || '',
        baseValue: attr.baseValue,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        category: attr.category,
      })),
      skills: template.skills.map((skill, index) => ({
        id: `skill-${index}`,
        worldId: '', // Will be set when world is created
        name: skill.name,
        description: skill.description || '',
        baseValue: skill.baseValue,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
        difficulty: skill.difficulty,
        category: skill.category,
      })),
      settings: {
        maxAttributes: 8,
        maxSkills: 12,
        attributePointPool: 150,
        skillPointPool: 100,
      },
    };
  }
}