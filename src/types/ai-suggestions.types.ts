/**
 * Type definitions for AI-generated suggestions
 */
import type { SkillDifficulty } from './skill-difficulty.types';

interface AISuggestionBase {
  name: string;
  description: string;
  category?: string;
  accepted: boolean;
}

export interface AttributeSuggestion extends AISuggestionBase {
  baseValue: number;
  minValue: number;
  maxValue: number;
}

export interface SkillSuggestion extends AISuggestionBase {
  difficulty: SkillDifficulty;
  linkedAttributeNames?: string[];
  baseValue: number;
  minValue: number;
  maxValue: number;
  isModified?: boolean;
  originalName?: string;
  originalDescription?: string;
  originalDifficulty?: SkillDifficulty;
}
