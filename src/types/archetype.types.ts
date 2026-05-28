// src/types/archetype.types.ts

import type { InventoryItemInput } from './inventory.types';

/**
 * Interface representing a character archetype.
 * Used for quick-start character generation and templates.
 */
export interface CharacterArchetype {
  id: string;
  name: string;
  description: string;
  level: number;
  attributes: Array<{
    id: string;
    name: string;
    value: number;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  background: {
    description: string;
    personality: string;
    motivation: string;
    fears: string[];
    physicalDescription?: string;
  };
  /** Archetype-appropriate equipment the character starts with. */
  startingInventory?: InventoryItemInput[];
}
