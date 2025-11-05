import { Factory } from 'fishery';
import type { World } from '@/types/world.types';

/**
 * Factory for generating World test data
 *
 * Usage:
 * ```typescript
 * // Generate a default world
 * const world = worldFactory.build();
 *
 * // Override specific properties
 * const cyberpunkWorld = worldFactory.build({
 *   name: 'Neo-Tokyo',
 *   genre: 'cyberpunk'
 * });
 *
 * // Generate multiple worlds
 * const worlds = worldFactory.buildList(5);
 * ```
 */
export const worldFactory = Factory.define<World>(({ sequence }) => ({
  id: `world-${sequence}`,
  name: `Test World ${sequence}`,
  description: `A test world for testing purposes`,
  genre: 'cyberpunk',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 20,
    skillPointPool: 20,
  },
  toneSettings: {
    contentRating: 'PG',
    narrativeStyle: 'balanced',
    languageComplexity: 'moderate',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Factory for generating WorldAttribute test data
 */
export const worldAttributeFactory = Factory.define<World['attributes'][0]>(
  ({ sequence }) => ({
    id: `attr-${sequence}`,
    worldId: `world-${sequence}`,
    name: `Attribute ${sequence}`,
    description: `Test attribute ${sequence}`,
    baseValue: 5,
    minValue: 0,
    maxValue: 10,
  })
);

/**
 * Factory for generating WorldSkill test data
 */
export const worldSkillFactory = Factory.define<World['skills'][0]>(
  ({ sequence }) => ({
    id: `skill-${sequence}`,
    worldId: `world-${sequence}`,
    name: `Skill ${sequence}`,
    description: `Test skill ${sequence}`,
    difficulty: 'medium',
    baseValue: 0,
    minValue: 0,
    maxValue: 10,
    attributeIds: [],
  })
);
