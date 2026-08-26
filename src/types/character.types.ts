// src/types/character.types.ts

import {
  EntityID,
  GeneratedImage,
  NamedEntity,
  TimestampedEntity,
} from './common.types';
import { Inventory } from './inventory.types';

/**
 * Represents a character in the game
 */
export interface Character extends NamedEntity, TimestampedEntity {
  worldId: EntityID;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  derivedStats: DerivedStat[];
  background: CharacterBackground;
  inventory: Inventory;
  status: CharacterStatus;
  portrait?: GeneratedImage;
}

export interface PortraitSubject {
  name: string;
  background?: Partial<
    Pick<
      CharacterBackground,
      'physicalDescription' | 'history' | 'personality' | 'isKnownFigure'
    >
  >;
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
 * Represents a derived stat calculated from character attributes
 */
export interface DerivedStat {
  id: EntityID;
  characterId: EntityID;
  derivedStatId: EntityID; // References formula ID in world settings
  name: string;
  currentValue: number; // Current amount (changes during gameplay)
  maxValue: number; // Calculated maximum from formula
  lastCalculated: string; // Timestamp
}

/**
 * Character background information
 */
interface CharacterBackground {
  history: string;
  personality: string;
  physicalDescription?: string; // Physical appearance description
  goals: string[];
  fears: string[];
  relationships: CharacterRelationship[];
  isKnownFigure?: boolean; // Whether this is a real or fictional known figure
  knownFigureType?:
    | 'historical'
    | 'fictional'
    | 'celebrity'
    | 'mythological'
    | 'other';
}

/**
 * Represents a relationship between characters
 */
interface CharacterRelationship {
  characterId: EntityID;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
  strength: number; // -100 to 100
  description?: string;
}

/**
 * Current status of a character
 */
interface CharacterStatus {
  conditions: string[];
  location?: string;
}
