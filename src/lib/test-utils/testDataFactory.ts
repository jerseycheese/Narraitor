/**
 * Test Data Factory
 *
 * Centralized factory for creating mock objects used in tests.
 * Provides consistent test data with sensible defaults that can be overridden.
 */

import type { World } from '@/types';
import type { WorldAttribute, WorldSkill } from '@/types/world.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import type { JournalEntry, JournalEntryType } from '@/types/journal.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { Character } from '@/state/characterStore';
import { generateUniqueId } from '@/lib/utils';

// Default timestamp for consistent test data
const DEFAULT_TIMESTAMP = '2023-01-01T00:00:00.000Z';

/**
 * Creates a mock World object with sensible defaults
 */
export function createMockWorld(overrides: Partial<World> = {}): World {
  return {
    id: overrides.id || generateUniqueId('world'),
    name: 'Test World',
    description: 'A test world for unit testing',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 30,
      skillPointPool: 40,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createMockWorldAttribute(
  overrides: Partial<WorldAttribute> = {}
): WorldAttribute {
  return {
    id: overrides.id || generateUniqueId('attr'),
    worldId: 'world-test-1',
    name: 'Strength',
    description: 'Physical power and endurance',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
    category: 'Physical',
    ...overrides,
  };
}

export function createMockWorldSkill(
  overrides: Partial<WorldSkill> = {}
): WorldSkill {
  return {
    id: overrides.id || generateUniqueId('skill'),
    worldId: 'world-test-1',
    name: 'Athletics',
    description: 'Physical prowess and agility',
    attributeIds: ['attr-1'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
    ...overrides,
  };
}

/**
 * Creates a mock Character object with sensible defaults
 */
export function createMockCharacter(
  overrides: Partial<Character> = {}
): Character {
  return {
    id: overrides.id || generateUniqueId('char'),
    worldId: 'world-test-1',
    name: 'Test Character',
    description: 'A test character for unit testing',
    level: 1,
    isPlayer: false,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'Test history',
      personality: 'Test personality',
      goals: ['Test goal 1', 'Test goal 2'],
      fears: ['Test fear'],
      relationships: [],
    },
    inventory: {
      characterId: overrides.id || 'char-test-1',
      items: [],
      capacity: 10,
      categories: [
        {
          id: 'equipment',
          name: 'Equipment',
          description: 'Weapons, armor, and gear',
          sortOrder: 0,
        },
        {
          id: 'consumables',
          name: 'Consumables',
          description: 'Potions and single-use items',
          sortOrder: 1,
        },
        {
          id: 'quest-items',
          name: 'Quest Items',
          description: 'Important story items',
          sortOrder: 2,
        },
      ],
      itemOrder: [],
    },
    status: {
      conditions: [],
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createMockNarrativeSegment(
  overrides: Partial<NarrativeSegment> = {}
): NarrativeSegment {
  return {
    id: overrides.id || generateUniqueId('seg'),
    worldId: 'world-test-1',
    sessionId: 'session-test-1',
    content: 'Test narrative content',
    type: 'scene',
    characterIds: [],
    metadata: {
      location: 'Test Location',
      mood: 'neutral',
      tags: [],
    },
    timestamp: new Date(DEFAULT_TIMESTAMP),
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createMockJournalEntry(
  overrides: Partial<JournalEntry> = {}
): JournalEntry {
  return {
    id: overrides.id || generateUniqueId('journal'),
    sessionId: 'session-test-1',
    worldId: 'world-test-1',
    characterId: 'char-test-1',
    type: 'character_event' as JournalEntryType,
    title: 'Test Journal Entry',
    content: 'Something happened in the test',
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: [],
      automaticEntry: false,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createMockInventoryItem(
  overrides: Partial<InventoryItem> = {}
): InventoryItem {
  const categoryId = overrides.categoryId ?? 'equipment';
  const quantity = overrides.quantity ?? 1;

  return {
    id: overrides.id ?? generateUniqueId('item'),
    name: overrides.name ?? 'Test Item',
    description: overrides.description ?? 'A test item for unit testing',
    categoryId,
    quantity,
    stackable: overrides.stackable ?? false,
    maxStack: overrides.maxStack,
    acquisitionHistory: overrides.acquisitionHistory ?? [
      {
        acquiredAt: DEFAULT_TIMESTAMP,
        method: 'manual',
        quantity,
      },
    ],
    categorization: overrides.categorization ?? {
      categoryId,
      source: 'manual',
      classifiedAt: DEFAULT_TIMESTAMP,
      confidence: 0.9,
    },
    createdAt: overrides.createdAt ?? DEFAULT_TIMESTAMP,
    updatedAt: overrides.updatedAt ?? DEFAULT_TIMESTAMP,
  };
}
