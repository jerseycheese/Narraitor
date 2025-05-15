// WizardState.ts
import { World } from '@/types/world.types';

export interface WizardState {
  currentStep: number;
  worldData: Partial<World>;
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  errors: Record<string, string>;
  isProcessing: boolean;
}

export interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  category?: string;
  accepted: boolean;
}

export interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  linkedAttributeName?: string;
  accepted: boolean;
}

export const WIZARD_STEPS = [
  { id: 'basic-info', label: 'Basic Information' },
  { id: 'description', label: 'World Description' },
  { id: 'attributes', label: 'Review Attributes' },
  { id: 'skills', label: 'Review Skills' },
  { id: 'finalize', label: 'Finalize' },
];
