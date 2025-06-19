// src/types/journal.types.ts

import { EntityID, TimestampedEntity } from './common.types';

/**
 * Represents a journal entry in the game
 */
export interface JournalEntry extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  type: JournalEntryType;
  title: string;
  content: string;
  significance: 'minor' | 'major' | 'critical';
  isRead: boolean;
  relatedEntities: RelatedEntity[];
  metadata: JournalMetadata;
}

/**
 * Types of journal entries
 */
export type JournalEntryType = 
  | 'character_event'
  | 'world_event'
  | 'relationship_change'
  | 'achievement'
  | 'discovery'
  | 'combat'
  | 'dialogue';

/**
 * Represents an entity related to a journal entry
 */
export interface RelatedEntity {
  type: 'character' | 'item' | 'location' | 'event';
  id: EntityID;
  name: string;
}

/**
 * Metadata for journal entries
 */
export interface JournalMetadata {
  tags: string[];
  automaticEntry: boolean;
  narrativeSegmentId?: EntityID;
}
