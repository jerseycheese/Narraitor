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
 *
 * MVP: Only 'enabled' is currently implemented
 * Post-MVP settings marked below (see issues #933, #935, #936 for roadmap)
 */
export interface LoreValidationSettings {
  enabled: boolean;                 // [IMPLEMENTED] Default: FALSE (post-MVP opt-in)
  strictness: LoreValidationStrictness; // [POST-MVP #936] Default: moderate
  validateEveryNSegments: number;   // [POST-MVP #933] Default: 1 (every segment)
  validateOnlyCheckpoints: boolean; // [POST-MVP #933] Default: false
  autoRegenerate: boolean;          // [POST-MVP #935] Default: false
  blockOnBreaking: boolean;         // [POST-MVP #935] Default: false (fail-open)
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
