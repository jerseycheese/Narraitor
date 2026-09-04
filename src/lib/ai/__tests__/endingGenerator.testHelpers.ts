/**
 * Test helpers for endingGenerator tests
 * Provides reusable mock data and setup utilities
 */

import { getTimestamp } from '@/lib/utils/timestamp';
import type { World } from '@/types/world.types';
import type { StoreCharacter } from '@/state/characterStore';
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

/**
 * Creates journal entries with mixed significance for testing summary filtering.
 * Five major entries come first so that critical entries only survive the
 * top-5 cut if they are ranked above major, not merely included in the filter.
 */
export function createMixedSignificanceJournalEntries(): JournalEntry[] {
  const baseEntry = {
    sessionId: 'session-789',
    characterId: 'char-456',
    worldId: 'world-123',
    title: '',
    isRead: false,
    relatedEntities: [],
    metadata: { tags: [], automaticEntry: false },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };

  return [
    {
      ...baseEntry,
      id: 'journal-minor-1',
      type: 'character_event' as const,
      content: 'Restocked supplies at the village market',
      significance: 'minor' as const,
    },
    ...[1, 2, 3, 4, 5].map(n => ({
      ...baseEntry,
      id: `journal-major-${n}`,
      type: 'character_event' as const,
      content: `Major moment ${n}: won a hard-fought skirmish`,
      significance: 'major' as const,
    })),
    {
      ...baseEntry,
      id: 'journal-critical-1',
      type: 'decision' as const,
      content: 'Critical moment: shattered the lich king\'s phylactery',
      significance: 'critical' as const,
    },
    {
      ...baseEntry,
      id: 'journal-critical-2',
      type: 'decision' as const,
      content: 'Critical moment: sacrificed the enchanted blade to seal the rift',
      significance: 'critical' as const,
    },
  ];
}

/**
 * Creates journal entries that pit a minor-significance achievement against a
 * full slate of major entries. The achievement is listed before the majors so
 * that, when achievements are treated as peers of 'major', it survives the
 * top-5 cut on stable-sort order — it would be dropped if achievements were
 * ranked only by their own (minor) significance.
 */
export function createAchievementPeerJournalEntries(): JournalEntry[] {
  const baseEntry = {
    sessionId: 'session-789',
    characterId: 'char-456',
    worldId: 'world-123',
    title: '',
    isRead: false,
    relatedEntities: [],
    metadata: { tags: [], automaticEntry: false },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };

  return [
    {
      ...baseEntry,
      id: 'journal-critical-1',
      type: 'decision' as const,
      content: 'Critical moment: shattered the lich king\'s phylactery',
      significance: 'critical' as const,
    },
    {
      ...baseEntry,
      id: 'journal-critical-2',
      type: 'decision' as const,
      content: 'Critical moment: sacrificed the enchanted blade to seal the rift',
      significance: 'critical' as const,
    },
    {
      ...baseEntry,
      id: 'journal-minor-achievement',
      type: 'achievement' as const,
      content: 'Minor achievement: recovered the lost locket',
      significance: 'minor' as const,
    },
    ...[1, 2, 3].map(n => ({
      ...baseEntry,
      id: `journal-major-${n}`,
      type: 'character_event' as const,
      content: `Major moment ${n}: won a hard-fought skirmish`,
      significance: 'major' as const,
    })),
  ];
}
