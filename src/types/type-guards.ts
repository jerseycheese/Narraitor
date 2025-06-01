// src/types/type-guards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { World } from './world.types';
import { Character } from './character.types';
import { InventoryItem } from './inventory.types';
import { NarrativeSegment } from './narrative.types';
import { JournalEntry, JournalEntryType } from './journal.types';

/**
 * Type guard for World objects
 */
export function isWorld(obj: unknown): obj is World {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'theme' in obj &&
    'attributes' in obj &&
    'skills' in obj &&
    'settings' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    Array.isArray((obj as any).attributes) &&
    Array.isArray((obj as any).skills) &&
    typeof (obj as any).settings === 'object' &&
    'maxAttributes' in (obj as any).settings &&
    'maxSkills' in (obj as any).settings &&
    'attributePointPool' in (obj as any).settings &&
    'skillPointPool' in (obj as any).settings;
}

/**
 * Type guard for Character objects
 */
export function isCharacter(obj: unknown): obj is Character {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'worldId' in obj &&
    'name' in obj &&
    'attributes' in obj &&
    'skills' in obj &&
    'background' in obj &&
    'inventory' in obj &&
    'status' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    Array.isArray((obj as any).attributes) &&
    Array.isArray((obj as any).skills) &&
    typeof (obj as any).background === 'object' &&
    typeof (obj as any).inventory === 'object' &&
    typeof (obj as any).status === 'object';
}

/**
 * Type guard for InventoryItem objects
 */
export function isInventoryItem(obj: unknown): obj is InventoryItem {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'categoryId' in obj &&
    'quantity' in obj &&
    typeof (obj as any).quantity === 'number';
}

/**
 * Type guard for NarrativeSegment objects
 */
export function isNarrativeSegment(obj: unknown): obj is NarrativeSegment {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'worldId' in obj &&
    'sessionId' in obj &&
    'content' in obj &&
    'type' in obj &&
    'characterIds' in obj &&
    'metadata' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    Array.isArray((obj as any).characterIds) &&
    typeof (obj as any).metadata === 'object';
}

/**
 * Valid journal entry types
 */
const validJournalEntryTypes: JournalEntryType[] = [
  'character_event',
  'world_event',
  'relationship_change',
  'achievement',
  'discovery',
  'combat',
  'dialogue'
];

/**
 * Type guard for JournalEntry objects
 */
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
