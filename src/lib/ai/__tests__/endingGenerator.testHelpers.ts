/**
 * Test helpers for endingGenerator tests
 * Provides reusable mock data and setup utilities
 */

import { getTimestamp } from '@/lib/utils/timestamp';
import type { World } from '@/types/world.types';
import type { Character as StoreCharacter } from '@/state/characterStore';
import type { JournalEntry } from '@/types/journal.types';
import type { NarrativeSegment } from '@/types/narrative.types';

// Re-export centralized timer utilities
export {
  setupTestTimers,
  cleanupTestTimers,
} from '@/lib/test-utils/testTimers';

// Mock client for Gemini API
export const mockGeminiClient = {
  generateContent: jest.fn(),
};

/**
 * Creates a mock world for testing
 */
export function createMockWorld(): World {
  return {
    id: 'world-123',
    name: 'Epic Fantasy Realm',
    description: 'A land of magic and adventure',
    genre: 'fantasy',
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 40,
    },
    attributes: [],
    skills: [],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
}

/**
 * Creates a mock character for testing
 */
export function createMockCharacter(): StoreCharacter {
  return {
    id: 'char-456',
    name: 'Aria Stormblade',
    worldId: 'world-123',
    description: 'A seasoned warrior with a noble heart',
    level: 10,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A seasoned warrior seeking redemption',
      personality: 'Brave and honorable',
      goals: ['Defeat the dark lord and restore peace', 'Find inner peace'],
      fears: ['Failure', 'Losing allies'],
      relationships: [],
    },
    inventory: {
      characterId: 'char-456',
      items: [],
      capacity: 100,
      categories: [],
      itemOrder: [],
    },
    isPlayer: true,
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Dark Castle',
    },
    portrait: undefined,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
}

/**
 * Creates mock narrative segments for testing
 */
export function createMockNarrativeSegments(): NarrativeSegment[] {
  return [
    {
      id: 'seg-1',
      content: 'Aria entered the dark castle, sword drawn.',
      type: 'action',
      sessionId: 'session-789',
      worldId: 'world-123',
      metadata: { tags: ['combat', 'castle'], mood: 'tense' },
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    },
    {
      id: 'seg-2',
      content: 'The final battle with the dark lord was epic.',
      type: 'action',
      sessionId: 'session-789',
      worldId: 'world-123',
      metadata: { tags: ['combat', 'boss-fight'], mood: 'action' },
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    },
  ];
}

/**
 * Creates mock journal entries for testing
 */
export function createMockJournalEntries(): JournalEntry[] {
  return [
    {
      id: 'journal-1',
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      type: 'achievement',
      title: 'Dragon Defeated',
      content: 'Defeated the dragon and saved the village',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['achievement', 'dragon'],
        automaticEntry: false,
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    },
  ];
}
