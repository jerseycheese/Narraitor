/**
 * Test helpers for characterStore tests
 * Provides reusable mock character data factories
 */

import type { StoreCharacter } from '../characterStore';
import type { EntityID } from '@/types/common.types';

// Re-export centralized timer utilities
export {
  setupTestTimers,
  cleanupTestTimers,
} from '@/lib/test-utils/testTimers';

// Type for creating test characters (omits fields added by store)
type CharacterInput = Omit<StoreCharacter, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Creates basic character test data
 */
export function createTestCharacterData(
  overrides?: Partial<CharacterInput>
): CharacterInput {
  const characterId: EntityID = '';

  return {
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A test character',
      personality: 'Friendly',
      goals: ['Testing'],
      fears: [],
      relationships: [],
    },
    isPlayer: true,
    status: {
      conditions: [],
    },
    inventory: {
      characterId,
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
    ...overrides,
  };
}

/**
 * Creates a character for attribute testing
 */
export function createAttributeTestCharacter(
  overrides?: Partial<CharacterInput>
) {
  return createTestCharacterData({
    name: 'Attribute Test Character',
    description: 'Character for testing attributes',
    background: {
      history: 'For testing attributes',
      personality: 'Analytical',
      goals: [],
      fears: [],
      relationships: [],
    },
    ...overrides,
  });
}

/**
 * Creates a character for skill testing
 */
export function createSkillTestCharacter() {
  return createTestCharacterData({
    name: 'Skill Test Character',
    description: 'Character for testing skills',
    background: {
      history: 'For testing skills',
      personality: 'Skilled',
      goals: [],
      fears: [],
      relationships: [],
    },
  });
}
