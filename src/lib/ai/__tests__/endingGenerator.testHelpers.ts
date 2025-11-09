/**
 * Test helpers for endingGenerator tests
 * Provides reusable mock data and setup utilities
 */

import { getTimestamp } from '@/lib/utils/timestamp';
import type { JournalEntry } from '@/types/journal.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import { createMockWorld, createMockCharacter } from '@/lib/test-utils/testDataFactory';

// Re-export centralized timer utilities
export { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

// Re-export factory functions
export { createMockWorld, createMockCharacter };

// Mock client for Gemini API
export const mockGeminiClient = {
  generateContent: jest.fn()
};

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
      updatedAt: getTimestamp()
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
      updatedAt: getTimestamp()
    }
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
        automaticEntry: false
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }
  ];
}

/**
 * Creates a standard mock ending response
 */
export function createMockEndingResponse(overrides?: {
  epilogue?: string;
  tone?: string;
  achievements?: string[];
}) {
  return `{
    "epilogue": "${overrides?.epilogue || 'The journey ends...'}",
    "characterLegacy": "A true hero...",
    "worldImpact": "Forever changed...",
    "tone": "${overrides?.tone || 'triumphant'}",
    "achievements": ${JSON.stringify(overrides?.achievements || ['Victory'])}
  }`;
}
