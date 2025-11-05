import { Factory } from 'fishery';
import type { Character, CharacterAttribute, CharacterSkill } from '@/state/characterStore';

/**
 * Factory for generating Character test data
 * Uses the store shape (not domain type) for consistency with visual tests
 *
 * Usage:
 * ```typescript
 * // Generate a default character
 * const character = characterFactory.build();
 *
 * // Override specific properties
 * const hacker = characterFactory.build({
 *   name: 'Nova Chen',
 *   worldId: 'world-cyberpunk-2077',
 *   level: 5,
 *   isPlayer: true
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
  level: 1,
  isPlayer: true,
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
 * Factory for generating CharacterAttribute test data (store shape)
 */
export const characterAttributeFactory = Factory.define<CharacterAttribute>(
  ({ sequence }) => ({
    id: `char-attr-${sequence}`,
    characterId: `char-${sequence}`,
    worldAttributeId: `attr-${sequence}`,
    name: `Attribute ${sequence}`,
    baseValue: 5,
    modifiedValue: 5,
  })
);

/**
 * Factory for generating CharacterSkill test data (store shape)
 */
export const characterSkillFactory = Factory.define<CharacterSkill>(
  ({ sequence }) => ({
    id: `char-skill-${sequence}`,
    characterId: `char-${sequence}`,
    worldSkillId: `skill-${sequence}`,
    name: `Skill ${sequence}`,
    level: 1,
  })
);
