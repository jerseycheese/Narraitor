// src/lib/utils/typeGuards/journalGuards.ts

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

function isJournalEntry(obj: unknown): obj is JournalEntry {
  if (obj === null || obj === undefined || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return 'id' in o &&
    'sessionId' in o &&
    'worldId' in o &&
    'characterId' in o &&
    'type' in o &&
    'title' in o &&
    'content' in o &&
    'significance' in o &&
    'isRead' in o &&
    'relatedEntities' in o &&
    'metadata' in o &&
    'createdAt' in o &&
    'updatedAt' in o &&
    validJournalEntryTypes.includes(o.type as JournalEntryType) &&
    Array.isArray(o.relatedEntities) &&
    typeof o.metadata === 'object';
}
