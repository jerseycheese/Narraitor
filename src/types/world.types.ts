// src/types/world.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

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
  theme: string;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
  image?: WorldImage;
  reference?: string;
  relationship?: 'set_in' | 'based_on';
}

/**
 * Represents an attribute within a world
 */
export interface WorldAttribute extends NamedEntity {
  worldId: EntityID;
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
