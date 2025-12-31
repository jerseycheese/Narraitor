/**
 * Test helpers for worldStore tests
 * Provides reusable world data factories
 */

import { WorldAttribute, WorldSkill } from '@/types/world.types';

/**
 * Creates basic world test data
 */
export function createTestWorldData(overrides?: Partial<{
  name: string;
  description: string;
  genre: string;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
}>) {
  return {
    name: 'Test World',
    description: 'A test fantasy world',
    genre: 'fantasy',
    attributes: [] as WorldAttribute[],
        skills: [] as WorldSkill[],
    derivedStats: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20
    },
    ...overrides
  };
}

/**
 * Creates test attribute data
 */
export function createTestAttributeData(overrides?: Partial<{
  name: string;
  description: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  category?: string;
}>) {
  return {
    name: 'Strength',
    description: 'Physical strength attribute',
    baseValue: 10,
    minValue: 3,
    maxValue: 18,
    ...overrides
  };
}

/**
 * Creates test skill data
 */
export function createTestSkillData(overrides?: Partial<{
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}>) {
  return {
    name: 'Swordsmanship',
    description: 'Skill with sword combat',
    difficulty: 'medium' as const,
    category: 'Combat',
    baseValue: 5,
    minValue: 0,
    maxValue: 10,
    ...overrides
  };
}
