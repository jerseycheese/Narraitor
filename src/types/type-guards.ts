// src/types/type-guards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { World } from './world.types';
import { Character } from './character.types';
import { InventoryItem } from './inventory.types';
import { NarrativeSegment } from './narrative.types';
import { JournalEntry, JournalEntryType } from './journal.types';
import { PlayerDecision, PersonalityTrait, ChoiceTypePreference } from './personalization.types';
import { safeTrim } from '@/lib/utils';

/**
 * Type guard for World objects
 */
export function isWorld(obj: unknown): obj is World {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'genre' in obj &&
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
 * Type guard for arrays of PlayerDecisions
 */
export function isPlayerDecisionArray(obj: unknown): obj is PlayerDecision[] {
  return Array.isArray(obj) && obj.every(item => isPlayerDecision(item));
}

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

/**
 * Type guard for PersonalityTrait
 */
export function isPersonalityTrait(value: unknown): value is PersonalityTrait {
  const validTraits: PersonalityTrait[] = [
    'diplomatic', 'patient', 'empathetic', 'direct', 'impulsive', 'brave',
    'cautious', 'logical', 'loyal', 'optimistic', 'independent', 'ambitious'
  ];
  return typeof value === 'string' && validTraits.includes(value as PersonalityTrait);
}

/**
 * Type guard for ChoiceTypePreference
 */
export function isChoiceTypePreference(value: unknown): value is ChoiceTypePreference {
  const validChoiceTypes: ChoiceTypePreference[] = [
    'diplomatic', 'aggressive', 'stealthy', 'helpful', 'selfish', 'lawful', 'chaotic', 'neutral'
  ];
  return typeof value === 'string' && validChoiceTypes.includes(value as ChoiceTypePreference);
}

/**
 * Type guard for PlayerDecision
 */
export function isPlayerDecision(obj: unknown): obj is PlayerDecision {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'choiceText' in obj &&
    'choiceType' in obj &&
    'context' in obj &&
    'timestamp' in obj &&
    typeof (obj as any).choiceText === 'string' &&
    isChoiceTypePreference((obj as any).choiceType) &&
    typeof (obj as any).context === 'object' &&
    typeof (obj as any).timestamp === 'string';
}

/**
 * Safe string validation helper
 */
export function isSafeString(value: unknown, maxLength: number = 200): value is string {
  return typeof value === 'string' && 
         value.length > 0 && 
         value.length <= maxLength;
}

/**
 * Sanitizes a string by removing dangerous content
 */
export function sanitizeString(value: unknown, maxLength: number = 200): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  
  // Remove HTML tags and dangerous characters
  const sanitized = safeTrim(value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[&"']/g, '') // Remove dangerous characters
    .substring(0, maxLength));
    
  return sanitized.length > 0 ? sanitized : undefined;
}

/**
 * Safe array validation helper
 */
export function isSafeStringArray(value: unknown, maxItems: number = 10, maxLength: number = 100): value is string[] {
  return Array.isArray(value) && 
         value.length <= maxItems &&
         value.every(item => isSafeString(item, maxLength));
}
