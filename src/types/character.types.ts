/**
 * Type definitions for the Character domain
 */

/**
 * Character entity within a specific world
 */
export interface Character {
  id: string;
  worldId: string;
  name: string;
  description: string;
  backstory: string;
  portraitUrl?: string;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Character attribute value
 */
export interface CharacterAttribute {
  id: string;
  definitionId: string; // References AttributeDefinition.id
  name: string; // Copy from definition for easier access
  value: number;
}

/**
 * Character skill value
 */
export interface CharacterSkill {
  id: string;
  definitionId: string; // References SkillDefinition.id
  name: string; // Copy from definition for easier access
  value: number;
}

/**
 * Character creation options
 */
export interface CharacterCreationOptions {
  worldId: string;
  useAiGeneration: boolean;
  skipBackstory: boolean;
  skipPortrait: boolean;
}
