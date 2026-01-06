// src/types/world-template.types.ts

import type { GenreValue } from './genre.types';
import type { SkillDifficulty } from './skill-difficulty.types';

/**
 * AI-generated world template definition.
 */
export interface WorldTemplate {
  name: string;
  description: string;
  genre: GenreValue;
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
