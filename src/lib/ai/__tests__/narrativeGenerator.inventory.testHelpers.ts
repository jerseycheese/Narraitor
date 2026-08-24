/**
 * Test helpers for narrativeGenerator inventory tests
 * Provides shared setup and mock utilities
 */

import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { AIClient } from '../types';
import {
  InventoryAcquisitionMethod,
  StandardInventoryCategory,
} from '@/types/inventory.types';

/**
 * Creates a mock Gemini client for testing
 */
export function createMockGeminiClient(): AIClient {
  return {
    generateContent: jest.fn().mockResolvedValue({
      content: 'Test narrative content',
      tokenUsage: 100,
    }),
  };
}

/**
 * Sets up test world and character for inventory tests
 */
export function setupTestWorldAndCharacter() {
  // Reset stores
  useInventoryStore.getState().reset();
  useWorldStore.getState().reset();
  useCharacterStore.getState().reset();

  // Create test world
  const worldId = useWorldStore.getState().create({
    name: 'Test World',
    description: 'A world for testing',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 10,
      skillPointPool: 10,
    },
  });
  useWorldStore.getState().setCurrent(worldId);

  // Create test character
  const characterId = useCharacterStore.getState().create({
    name: 'Test Hero',
    worldId,
    description: 'A hero for testing purposes',
    level: 1,
    isPlayer: true,
    status: {
      conditions: [],
    },
    background: {
      history: 'A brave adventurer',
      personality: 'Courageous',
      goals: [],
      fears: [],
      relationships: [],
    },
    attributes: [],
    skills: [],
    derivedStats: [],
    inventory: {
      characterId: '',
      items: [],
      capacity: 0,
      categories: [],
      itemOrder: [],
    },
  });

  useCharacterStore.getState().updateCharacter(characterId, {
    inventory: {
      characterId: characterId,
      items: [],
      capacity: 0,
      categories: [],
      itemOrder: [],
    },
  });

  return { worldId, characterId };
}

/**
 * Creates a mock item for testing
 */
export function createMockItem(
  overrides?: Partial<{
    name: string;
    description: string;
    stackable: boolean;
    quantity: number;
    categoryId: StandardInventoryCategory;
    method: InventoryAcquisitionMethod;
  }>
) {
  return {
    name: 'Test Item',
    description: 'A test item',
    stackable: false,
    quantity: 1,
    categorization: {
      categoryId: (overrides?.categoryId ||
        'equipment') as StandardInventoryCategory,
      source: 'manual' as const,
      classifiedAt: new Date().toISOString(),
    },
    acquisition: {
      method: (overrides?.method || 'loot') as InventoryAcquisitionMethod,
      description: 'Found in test',
      acquiredAt: new Date().toISOString(),
      quantity: overrides?.quantity || 1,
    },
    ...overrides,
  };
}

/**
 * Creates a basic narrative context for testing
 */
export function createTestNarrativeContext(
  worldId: string,
  characterId: string
) {
  return {
    worldId,
    currentSceneId: 'scene-1',
    characterIds: [characterId],
    previousSegments: [],
    currentTags: [],
    sessionId: 'test-session',
  };
}
