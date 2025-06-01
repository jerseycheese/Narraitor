/**
 * Type definitions for AI-generated suggestions
 */
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

export interface AISuggestionBase {
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
  linkedAttributeName?: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

export interface WorldAnalysisResult {
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
}

export interface AISuggestionsState {
  loading: boolean;
  error?: string;
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
}