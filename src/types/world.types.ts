// src/types/world.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { ToneSettings } from './tone-settings.types';
import { GenreValue } from '@/lib/constants/genres';

/**
 * World image data
 */
export interface WorldImage {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}

/**
 * Represents a game world configuration
 */
export interface World extends NamedEntity, TimestampedEntity {
  description: string;
  genre: GenreValue;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
  image?: WorldImage;
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
 * World-specific configuration settings
 */
export interface WorldSettings {
  maxAttributes: number;
  maxSkills: number;
  attributePointPool: number;
  skillPointPool: number;
}
