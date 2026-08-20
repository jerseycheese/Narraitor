// src/types/journal.types.ts

import { EntityID, TimestampedEntity, GeneratedImage } from './common.types';

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
  content: string; // Brief summary for list view
  detailedContent?: string; // Full narrative for detail view (optional, falls back to content)
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
  | 'dialogue'
  | 'decision'
  | 'session_start'
  | 'session_end'
  | 'item_acquisition'
  | 'item_usage';

/**
 * Represents an entity related to a journal entry
 */
interface RelatedEntity {
  type: 'character' | 'item' | 'location' | 'event';
  id: EntityID;
  name: string;
}

/**
 * Metadata for journal entries
 */
interface JournalMetadata {
  tags: string[];
  automaticEntry: boolean;
  narrativeSegmentId?: EntityID;
  // Decision-specific metadata
  decisionId?: EntityID;
  choiceText?: string;
  decisionPrompt?: string;
  outcomeSegmentId?: EntityID;
  // Session-specific metadata
  sessionDuration?: number;
  sessionStartTime?: string;
  sessionEndTime?: string;
  sessionStats?: {
    decisionsCount?: number;
    narrativeSegments?: number;
  };
  sessionContext?: {
    worldName?: string;
    characterName?: string;
    sessionNumber?: number;
  };
  // AI-generated visual for the entry
  image?: GeneratedImage;
}
