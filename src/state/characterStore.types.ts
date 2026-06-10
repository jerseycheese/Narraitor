import { EntityID } from '../types/common.types';
import { InventoryItem, InventoryCategory } from '../types/inventory.types';
import { DerivedStat } from '../types/character.types';

// Simplified character types for MVP implementation. Kept in their own module
// (rather than characterStore.ts) so pure lib code can depend on the shapes
// without importing the store and forming an import cycle.
export interface CharacterAttribute {
  id: EntityID;
  characterId: EntityID;
  worldAttributeId?: EntityID; // Reference to world attribute for safer matching
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
}

export interface CharacterSkill {
  id: EntityID;
  characterId: EntityID;
  worldSkillId?: EntityID; // Reference to world skill for safer matching
  name: string;
  level: number;
  category?: string;
}

// Note: DerivedStat is imported from character.types.ts

interface CharacterBackground {
  history: string;
  personality: string;
  goals: string[];
  fears: string[];
  physicalDescription?: string;
  relationships: unknown[];
  isKnownFigure?: boolean;
  knownFigureType?:
    | 'historical'
    | 'fictional'
    | 'celebrity'
    | 'mythological'
    | 'other';
}

interface CharacterStatus {
  health: number;
  maxHealth: number;
  conditions: string[];
  location?: string;
}

export interface Character {
  id: EntityID;
  name: string;
  description: string;
  worldId: EntityID;
  level: number;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  derivedStats: DerivedStat[];
  background: CharacterBackground;
  isPlayer: boolean;
  status: CharacterStatus;
  inventory: {
    characterId: EntityID;
    items: InventoryItem[];
    capacity: number;
    categories: InventoryCategory[];
    itemOrder: EntityID[];
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
  createdAt: string;
  updatedAt: string;
}
