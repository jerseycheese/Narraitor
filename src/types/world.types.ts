// src/types/world.types.ts

import {
  EntityID,
  GeneratedImage,
  NamedEntity,
  TimestampedEntity,
} from './common.types';
import type { SkillDifficulty } from './skill-difficulty.types';
import type { ToneSettings } from './tone-settings.types';
import type { GenreValue } from './genre.types';
import type { CharacterArchetype } from '@/types/archetype.types';

/**
 * Character template for quick character creation
 * Structurally identical to CharacterArchetype but stored per-world
 */
export type CharacterTemplate = CharacterArchetype;

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
  characterTemplates?: CharacterTemplate[];
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
 * Formula for calculating a derived stat from character attributes
 * AI-generated during world creation based on world's attributes
 */
export interface DerivedStatFormula extends NamedEntity {
  worldId: EntityID;
  description: string;
  baseValue?: number; // Optional base value to add (e.g., 10 for AC-style stats)
  attributeMultipliers: {
    [attributeId: string]: number; // Map of attributeId -> multiplier
  };
  minValue?: number; // Optional minimum value
  maxValue?: number; // Optional maximum value
}

/**
 * World-specific configuration settings
 */
export interface WorldSettings {
  maxAttributes: number;
  maxSkills: number;
  attributePointPool: number;
  skillPointPool: number;
  derivedStatFormulas?: DerivedStatFormula[]; // AI-generated stat formulas
}
