/**
 * Test helpers for skill-based narrative generation tests
 * Provides shared mocks and utilities for skill tests
 */

import { AIClient } from '../types';
import { World } from '@/types/world.types';
import { Character } from '@/types/character.types';
import { getTimestamp } from '@/lib/utils/timestamp';

/**
 * Creates a mock AI client for skill tests
 */
export function createMockAIClient(): jest.Mocked<AIClient> {
  return {
    generateContent: jest.fn()
  };
}

/**
 * Creates a mock world with skills
 */
export function createMockWorldWithSkills(): World {
  return {
    id: 'skill-world',
    name: 'Fantasy Realm',
    description: 'A world with magic and combat',
    genre: 'fantasy',
    skills: [
      {
        id: 'athletics',
        name: 'Athletics',
        description: 'Physical prowess and endurance',
        attributeIds: ['strength'],
        worldId: 'skill-world',
        difficulty: 'medium' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      },
      {
        id: 'magic',
        name: 'Magic',
        description: 'Arcane knowledge and spellcasting',
        attributeIds: ['intelligence'],
        worldId: 'skill-world',
        difficulty: 'hard' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      },
      {
        id: 'stealth',
        name: 'Stealth',
        description: 'Moving unseen and unheard',
        attributeIds: ['dexterity'],
        worldId: 'skill-world',
        difficulty: 'easy' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      }
    ],
    attributes: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 40
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
}

/**
 * Creates a mock character with skills
 */
export function createMockCharacterWithSkills(): Character {
  return {
    id: 'char-1',
    worldId: 'skill-world',
    name: 'Test Hero',
    description: 'A skilled adventurer ready for any challenge',
    background: {
      history: 'Skilled adventurer with years of experience',
      personality: 'Brave and resourceful',
      goals: ['Master all skills'],
      fears: ['Failure'],
      relationships: []
    },
    attributes: [
      { attributeId: 'strength', value: 16 },
      { attributeId: 'intelligence', value: 14 },
      { attributeId: 'dexterity', value: 12 }
    ],
    skills: [
      { skillId: 'athletics', level: 6, experience: 100, isActive: true },
      { skillId: 'magic', level: 4, experience: 80, isActive: true },
      { skillId: 'stealth', level: 3, experience: 60, isActive: true }
    ],
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 100,
      categories: [],
      itemOrder: []
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
}

/**
 * Export mock data for use in jest.mock() calls
 */
export const mockWorld = createMockWorldWithSkills();
export const mockCharacter = createMockCharacterWithSkills();
