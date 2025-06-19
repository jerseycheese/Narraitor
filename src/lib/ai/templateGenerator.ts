// src/lib/ai/templateGenerator.ts

import { AIClient } from './types';
import { generateWorldTemplatePrompt, TemplateGenerationContext } from './templatePrompts';
import { World } from '@/types/world.types';
import { parseAIJsonResponse, validateRequiredFields, validateArrayFields, handleAIRequest } from '@/lib/utils/aiResponseParser';

export interface WorldTemplate {
  name: string;
  description: string;
  theme: string;
  attributes: Array<{
    name: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    category: string;
  }>;
  skills: Array<{
    name: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    difficulty: 'trivial' | 'easy' | 'moderate' | 'hard' | 'extreme';
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
    const requiredFields = ['name', 'description', 'theme', 'attributes', 'skills', 'explanation'];
    const arrayFields = ['attributes', 'skills'];
    
    validateRequiredFields(template, requiredFields, 'template structure');
    const templateRecord = template as Record<string, unknown>;
    validateArrayFields(templateRecord, arrayFields, 'template structure');

    // Validate each attribute
    for (const attr of (templateRecord.attributes as any[])) {
      if (!attr.name || typeof attr.baseValue !== 'number' || 
          typeof attr.minValue !== 'number' || typeof attr.maxValue !== 'number') {
        throw new Error('Invalid attribute structure');
      }
    }

    // Validate each skill
    for (const skill of (templateRecord.skills as any[])) {
      if (!skill.name || typeof skill.baseValue !== 'number' || 
          typeof skill.minValue !== 'number' || typeof skill.maxValue !== 'number' ||
          !['trivial', 'easy', 'moderate', 'hard', 'extreme'].includes(skill.difficulty)) {
        throw new Error('Invalid skill structure');
      }
    }
  }

  convertTemplateToWorld(template: WorldTemplate): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: template.name,
      description: template.description,
      theme: template.theme,
      attributes: template.attributes.map((attr, index) => ({
        id: `attr-${index}`,
        worldId: '', // Will be set when world is created
        name: attr.name,
        baseValue: attr.baseValue,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        category: attr.category,
      })),
      skills: template.skills.map((skill, index) => ({
        id: `skill-${index}`,
        worldId: '', // Will be set when world is created
        name: skill.name,
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