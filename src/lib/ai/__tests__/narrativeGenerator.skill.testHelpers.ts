/**
 * Test helpers for skill-based narrative generation tests
 * Provides shared mocks and utilities for skill tests
 */

import { AIClient } from '../types';
import { World } from '@/types/world.types';
import { Character } from '@/state/characterStore';
import { getTimestamp } from '@/lib/utils/timestamp';

/**
 * Creates a mock AI client for skill tests
 */
export function createMockAIClient(): jest.Mocked<AIClient> {
  return {
    generateContent: jest.fn(),
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
        maxValue: 10,
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
        maxValue: 10,
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
        maxValue: 10,
      },
    ],
    attributes: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 40,
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
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
    level: 5,
    isPlayer: true,
    background: {
      history: 'Skilled adventurer with years of experience',
      personality: 'Brave and resourceful',
      goals: ['Master all skills'],
      fears: ['Failure'],
      relationships: [],
    },
    // Attribute values sit on the 1-10 scale worlds actually use (worldAnalyzer
    // pins minValue 1 / maxValue 10), so the narrative descriptors resolve to
    // Exceptional / High / Moderate rather than falling off the scale.
    attributes: [
      {
        id: 'attr-1',
        characterId: 'char-1',
        worldAttributeId: 'strength',
        name: 'Strength',
        baseValue: 9,
        modifiedValue: 9,
      },
      {
        id: 'attr-2',
        characterId: 'char-1',
        worldAttributeId: 'intelligence',
        name: 'Intelligence',
        baseValue: 7,
        modifiedValue: 7,
      },
      {
        id: 'attr-3',
        characterId: 'char-1',
        worldAttributeId: 'dexterity',
        name: 'Dexterity',
        baseValue: 4,
        modifiedValue: 4,
      },
    ],
    skills: [
      {
        id: 'skill-1',
        characterId: 'char-1',
        worldSkillId: 'athletics',
        name: 'Athletics',
        level: 6,
      },
      {
        id: 'skill-2',
        characterId: 'char-1',
        worldSkillId: 'magic',
        name: 'Magic',
        level: 4,
      },
      {
        id: 'skill-3',
        characterId: 'char-1',
        worldSkillId: 'stealth',
        name: 'Stealth',
        level: 3,
      },
    ],
    derivedStats: [],
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 100,
      categories: [],
      itemOrder: [],
    },
    status: {
      conditions: [],
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
}
