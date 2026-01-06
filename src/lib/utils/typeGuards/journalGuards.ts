// src/lib/utils/typeGuards/journalGuards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { JournalEntry, JournalEntryType } from '@/types/journal.types';

// Valid journal entry types
const validJournalEntryTypes: JournalEntryType[] = [
  'character_event',
  'world_event',
  'relationship_change',
  'achievement',
  'discovery',
  'combat',
  'dialogue',
  'decision'
];

export function isJournalEntry(obj: unknown): obj is JournalEntry {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'sessionId' in obj &&
    'worldId' in obj &&
    'characterId' in obj &&
    'type' in obj &&
    'title' in obj &&
    'content' in obj &&
    'significance' in obj &&
    'isRead' in obj &&
    'relatedEntities' in obj &&
    'metadata' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    validJournalEntryTypes.includes((obj as any).type) &&
    Array.isArray((obj as any).relatedEntities) &&
    typeof (obj as any).metadata === 'object';
}
