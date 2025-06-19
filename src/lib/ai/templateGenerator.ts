// src/lib/ai/templateGenerator.ts

import { AIClient } from './types';
import { generateWorldTemplatePrompt, TemplateGenerationContext } from './templatePrompts';
import { World } from '@/types/world.types';

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
    try {
      const prompt = generateWorldTemplatePrompt(context);
      const response = await this.geminiClient.generateContent(prompt);
      
      if (!response.content) {
        throw new Error('No content received from AI service');
      }

      // Parse the JSON response
      let templateData: WorldTemplate;
      try {
        templateData = JSON.parse(response.content);
      } catch (parseError) {
        throw new Error('Failed to parse world template');
      }

      // Validate the template structure
      this.validateTemplate(templateData);

      return templateData;
    } catch (error) {
      throw new Error('Failed to generate world template');
    }
  }

  validateTemplate(template: any): asserts template is WorldTemplate {
    const requiredFields = ['name', 'description', 'theme', 'attributes', 'skills', 'explanation'];
    
    for (const field of requiredFields) {
      if (!(field in template)) {
        throw new Error(`Invalid template structure: missing ${field}`);
      }
    }

    if (!Array.isArray(template.attributes) || !Array.isArray(template.skills)) {
      throw new Error('Invalid template structure: attributes and skills must be arrays');
    }

    // Validate each attribute
    for (const attr of template.attributes) {
      if (!attr.name || typeof attr.baseValue !== 'number' || 
          typeof attr.minValue !== 'number' || typeof attr.maxValue !== 'number') {
        throw new Error('Invalid attribute structure');
      }
    }

    // Validate each skill
    for (const skill of template.skills) {
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