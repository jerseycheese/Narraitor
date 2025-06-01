// src/types/character.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';
import { Inventory } from './inventory.types';

/**
 * Character portrait data
 */
export interface CharacterPortrait {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}

/**
 * Portrait generation status tracking
 */
export interface PortraitGenerationStatus {
  isGenerating: boolean;
  error: string | null;
  lastAttemptAt?: string;
}

/**
 * Represents a character in the game
 */
export interface Character extends NamedEntity, TimestampedEntity {
  worldId: EntityID;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  background: CharacterBackground;
  inventory: Inventory;
  status: CharacterStatus;
  portrait?: CharacterPortrait;
}

/**
 * Represents a character's attribute value
 */
export interface CharacterAttribute {
  attributeId: EntityID;
  value: number;
}

/**
 * Represents a character's skill level
 */
export interface CharacterSkill {
  skillId: EntityID;
  level: number;
  experience: number;
  isActive: boolean;
}

/**
 * Character background information
 */
export interface CharacterBackground {
  history: string;
  personality: string;
  physicalDescription?: string; // Physical appearance description
  goals: string[];
  fears: string[];
  relationships: CharacterRelationship[];
  isKnownFigure?: boolean; // Whether this is a real or fictional known figure
  knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
}

/**
 * Represents a relationship between characters
 */
export interface CharacterRelationship {
  characterId: EntityID;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
  strength: number; // -100 to 100
  description?: string;
}

/**
 * Current status of a character
 */
export interface CharacterStatus {
  health: number;
  maxHealth: number;
  conditions: string[];
  location?: string;
}
