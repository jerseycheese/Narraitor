import { TemplateHistoryEntry } from '@/types/game.types';

interface TemplateAttribute {
  name: string;
  description?: string;
  minValue: number;
  maxValue: number;
  baseValue: number;
  category: string;
}

interface TemplateSkill {
  name: string;
  description?: string;
  difficulty: string;
  category: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

/**
 * Convert a template history entry to wizard data format
 */
export const convertHistoryEntryToWizardData = (entry: TemplateHistoryEntry) => {
  const templateId = `ai-template-${Date.now()}`;
  
  return {
    selectedTemplateId: templateId,
    createOwnWorld: false,
    name: entry.template.name,
    description: entry.template.description,
    genre: entry.template.genre,
    aiSuggestions: {
      attributes: entry.template.attributes.map((attr: TemplateAttribute) => ({
        name: attr.name,
        description: attr.description || `${attr.name} represents a core aspect of characters in this world`,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
        baseValue: attr.baseValue,
        category: attr.category,
        accepted: true
      })),
      skills: entry.template.skills.map((skill: TemplateSkill) => ({
        name: skill.name,
        description: skill.description || `${skill.name} is an important skill for characters in this world`,
        difficulty: skill.difficulty,
        category: skill.category,
        baseValue: skill.baseValue,
        minValue: skill.minValue,
        maxValue: skill.maxValue,
        accepted: true
      }))
    }
  };
};

/**
 * Store template data in sessionStorage for wizard handoff
 */
export const storeTemplateDataForWizard = (templateData: Record<string, unknown>, storageKey: string = 'recent-template-data') => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey, JSON.stringify(templateData));
  }
};