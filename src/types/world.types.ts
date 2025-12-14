// src/types/world.types.ts

import { EntityID, GeneratedImage, NamedEntity, TimestampedEntity } from './common.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { ToneSettings } from './tone-settings.types';
import { GenreValue } from '@/lib/constants/genres';

/**
 * Represents a game world configuration
 */
export interface World extends NamedEntity, TimestampedEntity {
  description: string;
  genre: GenreValue;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
  image?: GeneratedImage;
  reference?: string;
  relationship?: 'set_within' | 'inspired_by';
  toneSettings?: ToneSettings;
}

/**
 * Represents an attribute within a world
 */
export interface WorldAttribute extends NamedEntity {
  worldId: EntityID;
  description: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  category?: string;
}

/**
 * Represents a skill within a world
 */
export interface WorldSkill extends NamedEntity {
  worldId: EntityID;
  description: string;
  attributeIds?: EntityID[];
  difficulty: SkillDifficulty;
  category?: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

/**
 * Lore validation strictness levels
 */
export type LoreValidationStrictness = 'lenient' | 'moderate' | 'strict';

/**
 * Lore validation configuration
 */
export interface LoreValidationSettings {
  enabled: boolean;                 // Default: FALSE (post-MVP opt-in)
  strictness: LoreValidationStrictness; // Default: moderate
  validateEveryNSegments: number;   // Default: 1 (every segment)
  validateOnlyCheckpoints: boolean; // Default: false (post-MVP)
  autoRegenerate: boolean;          // Default: false (post-MVP feature)
  blockOnBreaking: boolean;         // Default: false (fail-open)
}

/**
 * Default lore validation configuration
 */
export const DEFAULT_LORE_VALIDATION: LoreValidationSettings = {
  enabled: false,  // OFF by default - post-MVP opt-in
  strictness: 'moderate',
  validateEveryNSegments: 1,
  validateOnlyCheckpoints: false,
  autoRegenerate: false,
  blockOnBreaking: false,
};

/**
 * World-specific configuration settings
 */
export interface WorldSettings {
  maxAttributes: number;
  maxSkills: number;
  attributePointPool: number;
  skillPointPool: number;
  // Lore validation settings
  loreValidation?: LoreValidationSettings;
}
