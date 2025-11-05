/**
 * Test helpers for characterStore tests
 * Provides reusable mock character data factories
 */

import { Character } from '@/types/character.types';

type CharacterInput = Omit<Character, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Creates basic character test data
 */
export function createTestCharacterData(overrides?: Partial<CharacterInput>): CharacterInput {
  return {
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    background: {
      history: 'A test character',
      personality: 'Friendly',
      goals: ['Testing'],
      fears: [],
      relationships: []
    },
    isPlayer: true,
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: '',
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
    ...overrides
  };
}

/**
 * Creates a character for attribute testing
 */
export function createAttributeTestCharacter() {
  return createTestCharacterData({
    name: 'Attribute Test Character',
    description: 'Character for testing attributes',
    background: {
      history: 'For testing attributes',
      personality: 'Analytical',
      goals: [],
      fears: [],
      relationships: []
    }
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
      relationships: []
    }
  });
}

/**
 * Sets up fake timers with a standard test time
 */
export function setupTestTimers() {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
}
