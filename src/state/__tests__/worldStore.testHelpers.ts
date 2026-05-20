/**
 * Test helpers for worldStore tests
 * Provides reusable world data factories
 */

import type { GenreValue } from '@/types/genre.types';
import type { WorldAttribute, WorldSkill } from '@/types/world.types';

/**
 * Creates basic world test data
 */
export function createTestWorldData(
  overrides?: Partial<{
    name: string;
    description: string;
    genre: GenreValue;
    attributes: WorldAttribute[];
    skills: WorldSkill[];
  }>
) {
  return {
    name: 'Test World',
    description: 'A test fantasy world',
    genre: 'fantasy' as GenreValue,
    attributes: [] as WorldAttribute[],
    skills: [] as WorldSkill[],
    derivedStats: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    },
    ...overrides,
  };
}

/**
 * Creates test attribute data
 */
export function createTestAttributeData(
  overrides?: Partial<{
    name: string;
    description: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    category?: string;
  }>
) {
  return {
    name: 'Strength',
    description: 'Physical strength attribute',
    baseValue: 10,
    minValue: 3,
    maxValue: 18,
    ...overrides,
  };
}
