import { Factory } from 'fishery';
import type { Character } from '@/types/character.types';

/**
 * Factory for generating Character test data
 *
 * Usage:
 * ```typescript
 * // Generate a default character
 * const character = characterFactory.build();
 *
 * // Override specific properties
 * const hacker = characterFactory.build({
 *   name: 'Nova Chen',
 *   worldId: 'world-cyberpunk-2077'
 * });
 *
 * // Generate multiple characters
 * const characters = characterFactory.buildList(3);
 * ```
 */
export const characterFactory = Factory.define<Character>(({ sequence }) => ({
  id: `char-${sequence}`,
  name: `Test Character ${sequence}`,
  description: `A test character for testing purposes`,
  worldId: `world-${sequence}`,
  attributes: [],
  skills: [],
  background: {
    history: `Test character history ${sequence}`,
    personality: `Test personality ${sequence}`,
    physicalDescription: `Test physical description ${sequence}`,
    goals: [],
    fears: [],
    relationships: [],
    isKnownFigure: false,
  },
  status: {
    health: 100,
    maxHealth: 100,
    conditions: [],
  },
  inventory: {
    characterId: `char-${sequence}`,
    items: [],
    capacity: 15,
    categories: [],
    itemOrder: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Factory for generating CharacterAttribute test data
 */
export const characterAttributeFactory = Factory.define<Character['attributes'][0]>(
  ({ sequence }) => ({
    attributeId: `attr-${sequence}`,
    value: 5,
  })
);

/**
 * Factory for generating CharacterSkill test data
 */
export const characterSkillFactory = Factory.define<Character['skills'][0]>(
  ({ sequence }) => ({
    skillId: `skill-${sequence}`,
    level: 1,
    experience: 0,
    isActive: true,
  })
);
