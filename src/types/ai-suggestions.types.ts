/**
 * Type definitions for AI-generated suggestions
 */

export interface AISuggestionBase {
  name: string;
  description: string;
  category?: string;
  accepted: boolean;
}

export interface AttributeSuggestion extends AISuggestionBase {
  minValue: number;
  maxValue: number;
}

export interface SkillSuggestion extends AISuggestionBase {
  difficulty: 'easy' | 'medium' | 'hard';
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