// src/types/world.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

/**
 * Represents a game world configuration
 */
export interface World extends NamedEntity, TimestampedEntity {
  theme: string;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
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
  linkedAttributeId?: EntityID;
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
