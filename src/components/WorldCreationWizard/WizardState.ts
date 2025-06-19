// WizardState.ts
import { World, WorldSkill } from '@/types/world.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

export interface WizardState {
  currentStep: number;
  worldData: Partial<World>;
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  customSkills?: WorldSkill[]; // New: Track user-created skills separately
  errors: Record<string, string>;
  isProcessing: boolean;
  selectedTemplateId?: string | null;
  createOwnWorld?: boolean;
}

export interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  baseValue: number;
  category?: string;
  accepted: boolean;
}

export interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: SkillDifficulty;
  category?: string;
  linkedAttributeNames?: string[]; // Support for multiple attributes
  accepted: boolean;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

export const WIZARD_STEPS = [
  { id: 'template', label: 'Choose Template' },
  { id: 'basic-info', label: 'Basic Information' },
  { id: 'description', label: 'World Description' },
  { id: 'attributes', label: 'Review Attributes' },
  { id: 'skills', label: 'Review Skills' },
  { id: 'finalize', label: 'Finalize' },
];
