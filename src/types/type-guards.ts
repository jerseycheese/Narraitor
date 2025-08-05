// src/types/type-guards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { World, WorldAttribute, WorldSkill, WorldSettings, WorldImage } from './world.types';
import { Character, CharacterAttribute, CharacterSkill, CharacterBackground, CharacterStatus, CharacterPortrait, CharacterRelationship } from './character.types';
import { InventoryItem } from './inventory.types';
import { NarrativeSegment } from './narrative.types';
import { JournalEntry, JournalEntryType } from './journal.types';
import { PlayerDecision, PersonalityTrait, ChoiceTypePreference } from './personalization.types';
import { safeTrim } from '@/lib/utils';
import { normalizeText } from '../lib/utils/textNormalization';
import { ValidationResult } from '../lib/utils/validationUtils';

/**
 * Type guard for World objects with comprehensive validation.
 * 
 * Validates that an unknown object conforms to the World interface structure.
 * Supports both full validation and partial validation for incomplete objects.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns True if the object is a valid World, false otherwise
 * 
 * @example
 * ```typescript
 * // Full validation (all properties required)
 * const completeWorld = {
 *   id: 'world-1',
 *   name: 'Fantasy Realm',
 *   description: 'A magical world',
 *   genre: 'fantasy',
 *   attributes: [],
 *   skills: [],
 *   settings: { maxAttributes: 6, maxSkills: 8, attributePointPool: 27, skillPointPool: 20 },
 *   createdAt: '2025-01-13T10:00:00Z',
 *   updatedAt: '2025-01-13T10:00:00Z'
 * };
 * 
 * if (isWorld(completeWorld)) {
 *   // TypeScript now knows this is a World
 *   console.log(completeWorld.name); // Safe to access
 * }
 * 
 * // Partial validation (only validate present properties)
 * const partialWorld = { id: 'world-1', name: 'Test World' };
 * if (isWorld(partialWorld, { partial: true })) {
 *   // Only validates the properties that are present
 *   console.log(partialWorld.name);
 * }
 * ```
 */
export function isWorld(obj: unknown, options?: { partial?: boolean }): obj is World {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const world = obj as any;
  const { partial = false } = options || {};

  // Required properties (always checked)
  const hasRequiredProps = 
    typeof world.id === 'string' &&
    typeof world.name === 'string' &&
    typeof world.description === 'string' &&
    typeof world.genre === 'string';

  if (!hasRequiredProps) {
    return false;
  }

  // For partial objects, only check what's present
  if (partial) {
    if ('attributes' in world && !Array.isArray(world.attributes)) return false;
    if ('skills' in world && !Array.isArray(world.skills)) return false;
    if ('settings' in world && !isWorldSettings(world.settings)) return false;
    if ('image' in world && world.image !== null && !isWorldImage(world.image)) return false;
    return true;
  }

  // Full validation for complete objects
  return Array.isArray(world.attributes) &&
    Array.isArray(world.skills) &&
    isWorldSettings(world.settings) &&
    typeof world.createdAt === 'string' &&
    typeof world.updatedAt === 'string' &&
    (world.image === undefined || world.image === null || isWorldImage(world.image)) &&
    (world.reference === undefined || typeof world.reference === 'string') &&
    (world.relationship === undefined || ['set_within', 'inspired_by'].includes(world.relationship));
}

/**
 * ValidationResult-based World validation with detailed error messages.
 * 
 * Provides comprehensive validation with specific error messages for debugging.
 * Returns a ValidationResult object containing validation status and detailed error descriptions.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidWorld = { id: 'world-1' }; // Missing required properties
 * const result = validateWorld(invalidWorld);
 * 
 * if (!result.valid) {
 *   console.log('Validation errors:');
 *   result.errors.forEach(error => console.log(`- ${error}`));
 *   // Output:
 *   // - Property "name" must be a string
 *   // - Property "description" must be a string
 *   // - Property "genre" must be a string
 *   // - etc.
 * }
 * 
 * // Partial validation for form validation
 * const partialResult = validateWorld({ name: 'Test' }, { partial: true });
 * if (partialResult.valid) {
 *   console.log('Partial validation passed');
 * }
 * ```
 */
export function validateWorld(obj: unknown, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = [];
  const { partial = false } = options || {};

  if (obj === null || obj === undefined) {
    errors.push('World object cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const world = obj as any;

  // Required property validation
  if (typeof world.id !== 'string') {
    errors.push('Property "id" must be a string');
  }
  if (typeof world.name !== 'string') {
    errors.push('Property "name" must be a string');
  }
  if (typeof world.description !== 'string') {
    errors.push('Property "description" must be a string');
  }
  if (typeof world.genre !== 'string') {
    errors.push('Property "genre" must be a string');
  }

  // For partial validation, only check present properties
  if (!partial) {
    if (!Array.isArray(world.attributes)) {
      errors.push('Property "attributes" must be an array');
    } else {
      world.attributes.forEach((attr: any, index: number) => {
        if (!isWorldAttribute(attr)) {
          errors.push(`Invalid WorldAttribute at index ${index}`);
        }
      });
    }

    if (!Array.isArray(world.skills)) {
      errors.push('Property "skills" must be an array');
    } else {
      world.skills.forEach((skill: any, index: number) => {
        if (!isWorldSkill(skill)) {
          errors.push(`Invalid WorldSkill at index ${index}`);
        }
      });
    }

    const settingsValidation = validateWorldSettings(world.settings);
    if (!settingsValidation.valid) {
      errors.push(...settingsValidation.errors.map(e => `WorldSettings: ${e}`));
    }

    if (typeof world.createdAt !== 'string') {
      errors.push('Property "createdAt" must be a string');
    }
    if (typeof world.updatedAt !== 'string') {
      errors.push('Property "updatedAt" must be a string');
    }
  } else {
    // Partial validation - only check present properties
    if ('attributes' in world && !Array.isArray(world.attributes)) {
      errors.push('Property "attributes" must be an array when present');
    }
    if ('skills' in world && !Array.isArray(world.skills)) {
      errors.push('Property "skills" must be an array when present');
    }
    if ('settings' in world) {
      const settingsValidation = validateWorldSettings(world.settings, { partial: true });
      if (!settingsValidation.valid) {
        errors.push(...settingsValidation.errors.map(e => `WorldSettings: ${e}`));
      }
    }
  }

  // Optional property validation
  if (world.image !== undefined && world.image !== null) {
    const imageValidation = validateWorldImage(world.image);
    if (!imageValidation.valid) {
      errors.push(...imageValidation.errors.map(e => `WorldImage: ${e}`));
    }
  }

  if (world.reference !== undefined && typeof world.reference !== 'string') {
    errors.push('Property "reference" must be a string when present');
  }

  if (world.relationship !== undefined && !['set_within', 'inspired_by'].includes(world.relationship)) {
    errors.push('Property "relationship" must be "set_within" or "inspired_by" when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for Character objects with comprehensive validation.
 * 
 * Validates that an unknown object conforms to the Character interface structure.
 * Supports both full validation and partial validation for form inputs or incomplete data.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns True if the object is a valid Character, false otherwise
 * 
 * @example
 * ```typescript
 * // Full character validation
 * const character = {
 *   id: 'char-1',
 *   worldId: 'world-1',
 *   name: 'Hero',
 *   attributes: [],
 *   skills: [],
 *   background: {
 *     history: 'Born in a small village',
 *     personality: 'Brave and kind',
 *     goals: ['Save the kingdom'],
 *     fears: ['Dark magic'],
 *     relationships: []
 *   },
 *   inventory: {},
 *   status: {
 *     health: 100,
 *     maxHealth: 100,
 *     conditions: []
 *   },
 *   createdAt: '2025-01-13T10:00:00Z',
 *   updatedAt: '2025-01-13T10:00:00Z'
 * };
 * 
 * if (isCharacter(character)) {
 *   console.log(`Character: ${character.name}`);
 * }
 * 
 * // Partial validation for character creation form
 * const formData = { name: 'New Hero', worldId: 'world-1' };
 * if (isCharacter(formData, { partial: true })) {
 *   // Valid for form submission
 * }
 * ```
 */
export function isCharacter(obj: unknown, options?: { partial?: boolean }): obj is Character {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const character = obj as any;
  const { partial = false } = options || {};

  // Required properties (always checked)
  const hasRequiredProps = 
    typeof character.id === 'string' &&
    typeof character.worldId === 'string' &&
    typeof character.name === 'string';

  if (!hasRequiredProps) {
    return false;
  }

  // For partial objects, only check what's present
  if (partial) {
    if ('attributes' in character && !Array.isArray(character.attributes)) return false;
    if ('skills' in character && !Array.isArray(character.skills)) return false;
    if ('background' in character && !isCharacterBackground(character.background)) return false;
    if ('status' in character && !isCharacterStatus(character.status)) return false;
    return true;
  }

  // Full validation for complete objects
  return Array.isArray(character.attributes) &&
    Array.isArray(character.skills) &&
    isCharacterBackground(character.background) &&
    typeof character.inventory === 'object' &&
    isCharacterStatus(character.status) &&
    typeof character.createdAt === 'string' &&
    typeof character.updatedAt === 'string' &&
    (character.portrait === undefined || character.portrait === null || isCharacterPortrait(character.portrait));
}

/**
 * ValidationResult-based Character validation with detailed error messages.
 * 
 * Provides comprehensive validation with specific error messages for debugging character data.
 * Particularly useful for form validation and data import processes.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidCharacter = {
 *   id: 'char-1',
 *   worldId: 'world-1',
 *   name: 'Hero',
 *   attributes: 'invalid', // Should be array
 *   background: 'invalid'  // Should be object
 * };
 * 
 * const result = validateCharacter(invalidCharacter);
 * if (!result.valid) {
 *   result.errors.forEach(error => {
 *     console.log(`Character validation error: ${error}`);
 *   });
 *   // Output includes specific nested validation errors:
 *   // - Property "attributes" must be an array
 *   // - CharacterBackground: Expected object, got string
 * }
 * ```
 */
export function validateCharacter(obj: unknown, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = [];
  const { partial = false } = options || {};

  if (obj === null || obj === undefined) {
    errors.push('Character object cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const character = obj as any;

  // Required property validation
  if (typeof character.id !== 'string') {
    errors.push('Property "id" must be a string');
  }
  if (typeof character.worldId !== 'string') {
    errors.push('Property "worldId" must be a string');
  }
  if (typeof character.name !== 'string') {
    errors.push('Property "name" must be a string');
  }

  // For partial validation, only check present properties
  if (!partial) {
    if (!Array.isArray(character.attributes)) {
      errors.push('Property "attributes" must be an array');
    } else {
      character.attributes.forEach((attr: any, index: number) => {
        if (!isCharacterAttribute(attr)) {
          errors.push(`Invalid CharacterAttribute at index ${index}`);
        }
      });
    }

    if (!Array.isArray(character.skills)) {
      errors.push('Property "skills" must be an array');
    } else {
      character.skills.forEach((skill: any, index: number) => {
        if (!isCharacterSkill(skill)) {
          errors.push(`Invalid CharacterSkill at index ${index}`);
        }
      });
    }

    const backgroundValidation = validateCharacterBackground(character.background);
    if (!backgroundValidation.valid) {
      errors.push(...backgroundValidation.errors.map(e => `CharacterBackground: ${e}`));
    }

    const statusValidation = validateCharacterStatus(character.status);
    if (!statusValidation.valid) {
      errors.push(...statusValidation.errors.map(e => `CharacterStatus: ${e}`));
    }

    if (typeof character.inventory !== 'object' || character.inventory === null) {
      errors.push('Property "inventory" must be an object');
    }

    if (typeof character.createdAt !== 'string') {
      errors.push('Property "createdAt" must be a string');
    }
    if (typeof character.updatedAt !== 'string') {
      errors.push('Property "updatedAt" must be a string');
    }
  } else {
    // Partial validation - only check present properties
    if ('attributes' in character && !Array.isArray(character.attributes)) {
      errors.push('Property "attributes" must be an array when present');
    }
    if ('skills' in character && !Array.isArray(character.skills)) {
      errors.push('Property "skills" must be an array when present');
    }
    if ('background' in character) {
      const backgroundValidation = validateCharacterBackground(character.background, { partial: true });
      if (!backgroundValidation.valid) {
        errors.push(...backgroundValidation.errors.map(e => `CharacterBackground: ${e}`));
      }
    }
    if ('status' in character) {
      const statusValidation = validateCharacterStatus(character.status, { partial: true });
      if (!statusValidation.valid) {
        errors.push(...statusValidation.errors.map(e => `CharacterStatus: ${e}`));
      }
    }
  }

  // Optional property validation
  if (character.portrait !== undefined && character.portrait !== null) {
    const portraitValidation = validateCharacterPortrait(character.portrait);
    if (!portraitValidation.valid) {
      errors.push(...portraitValidation.errors.map(e => `CharacterPortrait: ${e}`));
    }
  }

  return { valid: errors.length === 0, errors };
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
 * Sanitizes a string by removing dangerous content and normalizing text
 */
export function sanitizeString(value: unknown, maxLength: number = 200): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  
  // First normalize the text to handle whitespace, quotes, and special characters
  let sanitized = normalizeText(value, {
    normalizeWhitespace: true,
    normalizeLineEndings: true,
    normalizeQuotes: true,
    normalizeSpecialChars: true,
    preserveStructure: false
  });
  
  // Remove HTML tags and dangerous characters
  sanitized = safeTrim(sanitized
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

// Domain-specific type guards

/**
 * Type guard for WorldAttribute objects.
 * 
 * Validates that an object conforms to the WorldAttribute interface,
 * including range validation for numeric values.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid WorldAttribute, false otherwise
 * 
 * @example
 * ```typescript
 * const attribute = {
 *   id: 'attr-1',
 *   name: 'Strength',
 *   worldId: 'world-1',
 *   description: 'Physical power',
 *   baseValue: 10,
 *   minValue: 1,
 *   maxValue: 20
 * };
 * 
 * if (isWorldAttribute(attribute)) {
 *   // TypeScript knows this is a WorldAttribute
 *   console.log(`${attribute.name}: ${attribute.baseValue}`);
 * }
 * ```
 */
export function isWorldAttribute(obj: unknown): obj is WorldAttribute {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const attr = obj as any;
  return typeof attr.id === 'string' &&
    typeof attr.name === 'string' &&
    typeof attr.worldId === 'string' &&
    typeof attr.description === 'string' &&
    typeof attr.baseValue === 'number' &&
    typeof attr.minValue === 'number' &&
    typeof attr.maxValue === 'number' &&
    attr.minValue <= attr.maxValue &&
    attr.baseValue >= attr.minValue &&
    attr.baseValue <= attr.maxValue;
}

/**
 * ValidationResult-based WorldAttribute validation with detailed error messages.
 * 
 * Validates WorldAttribute objects with comprehensive range checking and
 * provides specific error messages for each validation failure.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidAttribute = {
 *   id: 'attr-1',
 *   name: 'Strength',
 *   baseValue: 25, // Exceeds maxValue
 *   minValue: 10,
 *   maxValue: 20
 * };
 * 
 * const result = validateWorldAttribute(invalidAttribute);
 * if (!result.valid) {
 *   // Will include: "Property baseValue must be less than or equal to maxValue"
 *   console.log(result.errors);
 * }
 * ```
 */
export function validateWorldAttribute(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('WorldAttribute cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const attr = obj as any;

  if (typeof attr.id !== 'string') errors.push('Property "id" must be a string');
  if (typeof attr.name !== 'string') errors.push('Property "name" must be a string');
  if (typeof attr.worldId !== 'string') errors.push('Property "worldId" must be a string');
  if (typeof attr.description !== 'string') errors.push('Property "description" must be a string');
  if (typeof attr.baseValue !== 'number') errors.push('Property "baseValue" must be a number');
  if (typeof attr.minValue !== 'number') errors.push('Property "minValue" must be a number');
  if (typeof attr.maxValue !== 'number') errors.push('Property "maxValue" must be a number');
  
  if (typeof attr.minValue === 'number' && typeof attr.maxValue === 'number' && attr.minValue > attr.maxValue) {
    errors.push('Property "minValue" must be less than or equal to "maxValue"');
  }
  
  if (typeof attr.baseValue === 'number' && typeof attr.minValue === 'number' && attr.baseValue < attr.minValue) {
    errors.push('Property "baseValue" must be greater than or equal to "minValue"');
  }
  
  if (typeof attr.baseValue === 'number' && typeof attr.maxValue === 'number' && attr.baseValue > attr.maxValue) {
    errors.push('Property "baseValue" must be less than or equal to "maxValue"');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for WorldSkill objects.
 * 
 * Validates that an object conforms to the WorldSkill interface,
 * including difficulty level validation and range checking.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid WorldSkill, false otherwise
 * 
 * @example
 * ```typescript
 * const skill = {
 *   id: 'skill-1',
 *   name: 'Sword Fighting',
 *   worldId: 'world-1',
 *   description: 'Combat with bladed weapons',
 *   difficulty: 'medium',
 *   baseValue: 5,
 *   minValue: 0,
 *   maxValue: 10,
 *   attributeIds: ['strength', 'dexterity']
 * };
 * 
 * if (isWorldSkill(skill)) {
 *   console.log(`${skill.name} (${skill.difficulty})`);
 * }
 * ```
 */
export function isWorldSkill(obj: unknown): obj is WorldSkill {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const skill = obj as any;
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  
  return typeof skill.id === 'string' &&
    typeof skill.name === 'string' &&
    typeof skill.worldId === 'string' &&
    typeof skill.description === 'string' &&
    validDifficulties.includes(skill.difficulty) &&
    typeof skill.baseValue === 'number' &&
    typeof skill.minValue === 'number' &&
    typeof skill.maxValue === 'number' &&
    skill.minValue <= skill.maxValue &&
    skill.baseValue >= skill.minValue &&
    skill.baseValue <= skill.maxValue &&
    (skill.attributeIds === undefined || Array.isArray(skill.attributeIds));
}

/**
 * ValidationResult-based WorldSkill validation with detailed error messages.
 * 
 * Validates WorldSkill objects including difficulty enum validation
 * and numeric range checking.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidSkill = {
 *   id: 'skill-1',
 *   difficulty: 'invalid-level', // Must be 'easy', 'medium', 'hard', or 'expert'
 *   baseValue: -5 // Must be non-negative
 * };
 * 
 * const result = validateWorldSkill(invalidSkill);
 * // result.errors will include specific validation failures
 * ```
 */
export function validateWorldSkill(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];

  if (obj === null || obj === undefined) {
    errors.push('WorldSkill cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const skill = obj as any;

  if (typeof skill.id !== 'string') errors.push('Property "id" must be a string');
  if (typeof skill.name !== 'string') errors.push('Property "name" must be a string');
  if (typeof skill.worldId !== 'string') errors.push('Property "worldId" must be a string');
  if (typeof skill.description !== 'string') errors.push('Property "description" must be a string');
  if (!validDifficulties.includes(skill.difficulty)) {
    errors.push(`Property "difficulty" must be one of: ${validDifficulties.join(', ')}`);
  }
  if (typeof skill.baseValue !== 'number') errors.push('Property "baseValue" must be a number');
  if (typeof skill.minValue !== 'number') errors.push('Property "minValue" must be a number');
  if (typeof skill.maxValue !== 'number') errors.push('Property "maxValue" must be a number');
  
  if (typeof skill.minValue === 'number' && typeof skill.maxValue === 'number' && skill.minValue > skill.maxValue) {
    errors.push('Property "minValue" must be less than or equal to "maxValue"');
  }
  
  if (skill.attributeIds !== undefined && !Array.isArray(skill.attributeIds)) {
    errors.push('Property "attributeIds" must be an array when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for WorldSettings objects.
 * 
 * Validates that an object conforms to the WorldSettings interface,
 * ensuring all numeric values are positive.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid WorldSettings, false otherwise
 * 
 * @example
 * ```typescript
 * const settings = {
 *   maxAttributes: 6,
 *   maxSkills: 8,
 *   attributePointPool: 27,
 *   skillPointPool: 20
 * };
 * 
 * if (isWorldSettings(settings)) {
 *   console.log(`Max attributes: ${settings.maxAttributes}`);
 * }
 * ```
 */
export function isWorldSettings(obj: unknown): obj is WorldSettings {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const settings = obj as any;
  return typeof settings.maxAttributes === 'number' &&
    typeof settings.maxSkills === 'number' &&
    typeof settings.attributePointPool === 'number' &&
    typeof settings.skillPointPool === 'number' &&
    settings.maxAttributes > 0 &&
    settings.maxSkills > 0 &&
    settings.attributePointPool > 0 &&
    settings.skillPointPool > 0;
}

/**
 * ValidationResult-based WorldSettings validation with detailed error messages.
 * 
 * Validates WorldSettings objects with positive number requirements.
 * Supports partial validation for form inputs.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidSettings = {
 *   maxAttributes: -1, // Must be positive
 *   maxSkills: 0       // Must be greater than 0
 * };
 * 
 * const result = validateWorldSettings(invalidSettings);
 * // result.errors will include specific positive number requirements
 * ```
 */
export function validateWorldSettings(obj: unknown, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = [];
  const { partial = false } = options || {};

  if (obj === null || obj === undefined) {
    errors.push('WorldSettings cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const settings = obj as any;

  if (!partial) {
    if (typeof settings.maxAttributes !== 'number') {
      errors.push('Property "maxAttributes" must be a number');
    } else if (settings.maxAttributes <= 0) {
      errors.push('Property "maxAttributes" must be greater than 0');
    }

    if (typeof settings.maxSkills !== 'number') {
      errors.push('Property "maxSkills" must be a number');
    } else if (settings.maxSkills <= 0) {
      errors.push('Property "maxSkills" must be greater than 0');
    }

    if (typeof settings.attributePointPool !== 'number') {
      errors.push('Property "attributePointPool" must be a number');
    } else if (settings.attributePointPool <= 0) {
      errors.push('Property "attributePointPool" must be greater than 0');
    }

    if (typeof settings.skillPointPool !== 'number') {
      errors.push('Property "skillPointPool" must be a number');
    } else if (settings.skillPointPool <= 0) {
      errors.push('Property "skillPointPool" must be greater than 0');
    }
  } else {
    // Partial validation - only check present properties
    if ('maxAttributes' in settings) {
      if (typeof settings.maxAttributes !== 'number') {
        errors.push('Property "maxAttributes" must be a number when present');
      } else if (settings.maxAttributes <= 0) {
        errors.push('Property "maxAttributes" must be greater than 0');
      }
    }
    
    if ('maxSkills' in settings) {
      if (typeof settings.maxSkills !== 'number') {
        errors.push('Property "maxSkills" must be a number when present');
      } else if (settings.maxSkills <= 0) {
        errors.push('Property "maxSkills" must be greater than 0');
      }
    }
    
    if ('attributePointPool' in settings) {
      if (typeof settings.attributePointPool !== 'number') {
        errors.push('Property "attributePointPool" must be a number when present');
      } else if (settings.attributePointPool <= 0) {
        errors.push('Property "attributePointPool" must be greater than 0');
      }
    }
    
    if ('skillPointPool' in settings) {
      if (typeof settings.skillPointPool !== 'number') {
        errors.push('Property "skillPointPool" must be a number when present');
      } else if (settings.skillPointPool <= 0) {
        errors.push('Property "skillPointPool" must be greater than 0');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for WorldImage objects.
 * 
 * Validates that an object conforms to the WorldImage interface,
 * including type validation and optional property handling.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid WorldImage, false otherwise
 * 
 * @example
 * ```typescript
 * const image = {
 *   type: 'ai-generated',
 *   url: 'https://example.com/image.jpg',
 *   generatedAt: '2025-01-13T10:00:00Z',
 *   prompt: 'A fantasy castle'
 * };
 * 
 * if (isWorldImage(image)) {
 *   if (image.url) {
 *     console.log(`Image URL: ${image.url}`);
 *   }
 * }
 * ```
 */
export function isWorldImage(obj: unknown): obj is WorldImage {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const image = obj as any;
  return ['ai-generated', 'placeholder'].includes(image.type) &&
    (image.url === null || typeof image.url === 'string') &&
    (image.generatedAt === undefined || typeof image.generatedAt === 'string') &&
    (image.prompt === undefined || typeof image.prompt === 'string');
}

/**
 * ValidationResult-based WorldImage validation with detailed error messages.
 * 
 * Validates WorldImage objects including type enum validation
 * and optional property type checking.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidImage = {
 *   type: 'invalid-type', // Must be 'ai-generated' or 'placeholder'
 *   url: 123            // Must be string or null
 * };
 * 
 * const result = validateWorldImage(invalidImage);
 * // result.errors will include type validation failures
 * ```
 */
export function validateWorldImage(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validTypes = ['ai-generated', 'placeholder'];

  if (obj === null || obj === undefined) {
    errors.push('WorldImage cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const image = obj as any;

  if (!validTypes.includes(image.type)) {
    errors.push(`Property "type" must be one of: ${validTypes.join(', ')}`);
  }

  if (image.url !== null && typeof image.url !== 'string') {
    errors.push('Property "url" must be null or a string');
  }

  if (image.generatedAt !== undefined && typeof image.generatedAt !== 'string') {
    errors.push('Property "generatedAt" must be a string when present');
  }

  if (image.prompt !== undefined && typeof image.prompt !== 'string') {
    errors.push('Property "prompt" must be a string when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterAttribute objects.
 * 
 * Validates that an object conforms to the CharacterAttribute interface,
 * ensuring the value is non-negative.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterAttribute, false otherwise
 * 
 * @example
 * ```typescript
 * const charAttribute = {
 *   attributeId: 'strength',
 *   value: 15
 * };
 * 
 * if (isCharacterAttribute(charAttribute)) {
 *   console.log(`Attribute value: ${charAttribute.value}`);
 * }
 * ```
 */
export function isCharacterAttribute(obj: unknown): obj is CharacterAttribute {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const attr = obj as any;
  return typeof attr.attributeId === 'string' &&
    typeof attr.value === 'number' &&
    attr.value >= 0;
}

/**
 * ValidationResult-based CharacterAttribute validation with detailed error messages.
 * 
 * Validates CharacterAttribute objects with non-negative value requirements.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidAttribute = {
 *   attributeId: 'strength',
 *   value: -5 // Must be non-negative
 * };
 * 
 * const result = validateCharacterAttribute(invalidAttribute);
 * // result.errors will include: "Property value must be non-negative"
 * ```
 */
export function validateCharacterAttribute(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('CharacterAttribute cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const attr = obj as any;

  if (typeof attr.attributeId !== 'string') {
    errors.push('Property "attributeId" must be a string');
  }

  if (typeof attr.value !== 'number') {
    errors.push('Property "value" must be a number');
  } else if (attr.value < 0) {
    errors.push('Property "value" must be non-negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterSkill objects.
 * 
 * Validates that an object conforms to the CharacterSkill interface,
 * including level and experience validation.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterSkill, false otherwise
 * 
 * @example
 * ```typescript
 * const charSkill = {
 *   skillId: 'sword-fighting',
 *   level: 3,
 *   experience: 150,
 *   isActive: true
 * };
 * 
 * if (isCharacterSkill(charSkill)) {
 *   console.log(`${charSkill.skillId}: Level ${charSkill.level}`);
 * }
 * ```
 */
export function isCharacterSkill(obj: unknown): obj is CharacterSkill {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const skill = obj as any;
  return typeof skill.skillId === 'string' &&
    typeof skill.level === 'number' &&
    typeof skill.experience === 'number' &&
    typeof skill.isActive === 'boolean' &&
    skill.level >= 0 &&
    skill.experience >= 0;
}

/**
 * ValidationResult-based CharacterSkill validation with detailed error messages.
 * 
 * Validates CharacterSkill objects with non-negative numeric requirements.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidSkill = {
 *   skillId: 'sword-fighting',
 *   level: -1,    // Must be non-negative
 *   experience: 'high' // Must be number
 * };
 * 
 * const result = validateCharacterSkill(invalidSkill);
 * // result.errors will include specific validation failures
 * ```
 */
export function validateCharacterSkill(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('CharacterSkill cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const skill = obj as any;

  if (typeof skill.skillId !== 'string') {
    errors.push('Property "skillId" must be a string');
  }

  if (typeof skill.level !== 'number') {
    errors.push('Property "level" must be a number');
  } else if (skill.level < 0) {
    errors.push('Property "level" must be non-negative');
  }

  if (typeof skill.experience !== 'number') {
    errors.push('Property "experience" must be a number');
  } else if (skill.experience < 0) {
    errors.push('Property "experience" must be non-negative');
  }

  if (typeof skill.isActive !== 'boolean') {
    errors.push('Property "isActive" must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterBackground objects.
 * 
 * Validates that an object conforms to the CharacterBackground interface,
 * including arrays and nested relationship validation.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterBackground, false otherwise
 * 
 * @example
 * ```typescript
 * const background = {
 *   history: 'Born in a small village',
 *   personality: 'Brave and compassionate',
 *   goals: ['Save the kingdom', 'Find my family'],
 *   fears: ['Dark magic', 'Losing friends'],
 *   relationships: [
 *     { characterId: 'npc-1', type: 'ally', strength: 80 }
 *   ],
 *   physicalDescription: 'Tall with brown hair',
 *   isKnownFigure: false
 * };
 * 
 * if (isCharacterBackground(background)) {
 *   console.log(background.history);
 * }
 * ```
 */
export function isCharacterBackground(obj: unknown): obj is CharacterBackground {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const bg = obj as any;
  return typeof bg.history === 'string' &&
    typeof bg.personality === 'string' &&
    Array.isArray(bg.goals) &&
    Array.isArray(bg.fears) &&
    Array.isArray(bg.relationships) &&
    bg.goals.every((goal: any) => typeof goal === 'string') &&
    bg.fears.every((fear: any) => typeof fear === 'string') &&
    bg.relationships.every((rel: any) => isCharacterRelationship(rel)) &&
    (bg.physicalDescription === undefined || typeof bg.physicalDescription === 'string') &&
    (bg.isKnownFigure === undefined || typeof bg.isKnownFigure === 'boolean') &&
    (bg.knownFigureType === undefined || 
     ['historical', 'fictional', 'celebrity', 'mythological', 'other'].includes(bg.knownFigureType));
}

/**
 * ValidationResult-based CharacterBackground validation with detailed error messages.
 * 
 * Validates CharacterBackground objects including array content validation
 * and nested relationship validation. Supports partial validation.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidBackground = {
 *   history: '',  // Cannot be empty
 *   goals: 'string', // Must be array
 *   relationships: [{ invalid: 'object' }] // Invalid relationship structure
 * };
 * 
 * const result = validateCharacterBackground(invalidBackground);
 * // result.errors will include detailed validation failures
 * ```
 */
export function validateCharacterBackground(obj: unknown, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = [];
  const { partial = false } = options || {};
  const validKnownFigureTypes = ['historical', 'fictional', 'celebrity', 'mythological', 'other'];

  if (obj === null || obj === undefined) {
    errors.push('CharacterBackground cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const bg = obj as any;

  if (!partial) {
    if (typeof bg.history !== 'string') {
      errors.push('Property "history" must be a string');
    }

    if (typeof bg.personality !== 'string') {
      errors.push('Property "personality" must be a string');
    }

    if (!Array.isArray(bg.goals)) {
      errors.push('Property "goals" must be an array');
    } else if (!bg.goals.every((goal: any) => typeof goal === 'string')) {
      errors.push('All elements in "goals" must be strings');
    }

    if (!Array.isArray(bg.fears)) {
      errors.push('Property "fears" must be an array');
    } else if (!bg.fears.every((fear: any) => typeof fear === 'string')) {
      errors.push('All elements in "fears" must be strings');
    }

    if (!Array.isArray(bg.relationships)) {
      errors.push('Property "relationships" must be an array');
    } else {
      bg.relationships.forEach((rel: any, index: number) => {
        if (!isCharacterRelationship(rel)) {
          errors.push(`Invalid CharacterRelationship at index ${index}`);
        }
      });
    }
  } else {
    // Partial validation - only check present properties
    if ('history' in bg && typeof bg.history !== 'string') {
      errors.push('Property "history" must be a string when present');
    }
    
    if ('personality' in bg && typeof bg.personality !== 'string') {
      errors.push('Property "personality" must be a string when present');
    }
    
    if ('goals' in bg) {
      if (!Array.isArray(bg.goals)) {
        errors.push('Property "goals" must be an array when present');
      } else if (!bg.goals.every((goal: any) => typeof goal === 'string')) {
        errors.push('All elements in "goals" must be strings');
      }
    }
    
    if ('fears' in bg) {
      if (!Array.isArray(bg.fears)) {
        errors.push('Property "fears" must be an array when present');
      } else if (!bg.fears.every((fear: any) => typeof fear === 'string')) {
        errors.push('All elements in "fears" must be strings');
      }
    }
  }

  // Optional property validation
  if (bg.physicalDescription !== undefined && typeof bg.physicalDescription !== 'string') {
    errors.push('Property "physicalDescription" must be a string when present');
  }

  if (bg.isKnownFigure !== undefined && typeof bg.isKnownFigure !== 'boolean') {
    errors.push('Property "isKnownFigure" must be a boolean when present');
  }

  if (bg.knownFigureType !== undefined && !validKnownFigureTypes.includes(bg.knownFigureType)) {
    errors.push(`Property "knownFigureType" must be one of: ${validKnownFigureTypes.join(', ')} when present`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterRelationship objects.
 * 
 * Validates that an object conforms to the CharacterRelationship interface,
 * including type enum validation and strength range checking.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterRelationship, false otherwise
 * 
 * @example
 * ```typescript
 * const relationship = {
 *   characterId: 'npc-mentor',
 *   type: 'ally',
 *   strength: 75,
 *   description: 'My trusted mentor who taught me everything'
 * };
 * 
 * if (isCharacterRelationship(relationship)) {
 *   console.log(`${relationship.type}: ${relationship.strength}%`);
 * }
 * ```
 */
export function isCharacterRelationship(obj: unknown): obj is CharacterRelationship {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const rel = obj as any;
  const validTypes = ['ally', 'enemy', 'neutral', 'romantic', 'family'];
  
  return typeof rel.characterId === 'string' &&
    validTypes.includes(rel.type) &&
    typeof rel.strength === 'number' &&
    rel.strength >= -100 &&
    rel.strength <= 100 &&
    (rel.description === undefined || typeof rel.description === 'string');
}

/**
 * ValidationResult-based CharacterRelationship validation with detailed error messages.
 * 
 * Validates CharacterRelationship objects including type enum validation
 * and strength range validation (-100 to 100).
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidRelationship = {
 *   characterId: 'npc-1',
 *   type: 'invalid-type', // Must be 'ally', 'enemy', 'neutral', 'romantic', or 'family'
 *   strength: 150         // Must be between -100 and 100
 * };
 * 
 * const result = validateCharacterRelationship(invalidRelationship);
 * // result.errors will include type and range validation failures
 * ```
 */
export function validateCharacterRelationship(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validTypes = ['ally', 'enemy', 'neutral', 'romantic', 'family'];

  if (obj === null || obj === undefined) {
    errors.push('CharacterRelationship cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const rel = obj as any;

  if (typeof rel.characterId !== 'string') {
    errors.push('Property "characterId" must be a string');
  }

  if (!validTypes.includes(rel.type)) {
    errors.push(`Property "type" must be one of: ${validTypes.join(', ')}`);
  }

  if (typeof rel.strength !== 'number') {
    errors.push('Property "strength" must be a number');
  } else if (rel.strength < -100 || rel.strength > 100) {
    errors.push('Property "strength" must be between -100 and 100');
  }

  if (rel.description !== undefined && typeof rel.description !== 'string') {
    errors.push('Property "description" must be a string when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterStatus objects.
 * 
 * Validates that an object conforms to the CharacterStatus interface,
 * including health range validation and conditions array checking.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterStatus, false otherwise
 * 
 * @example
 * ```typescript
 * const status = {
 *   health: 75,
 *   maxHealth: 100,
 *   conditions: ['blessed', 'well-rested'],
 *   location: 'Castle Courtyard'
 * };
 * 
 * if (isCharacterStatus(status)) {
 *   console.log(`Health: ${status.health}/${status.maxHealth}`);
 * }
 * ```
 */
export function isCharacterStatus(obj: unknown): obj is CharacterStatus {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const status = obj as any;
  return typeof status.health === 'number' &&
    typeof status.maxHealth === 'number' &&
    Array.isArray(status.conditions) &&
    status.health >= 0 &&
    status.maxHealth > 0 &&
    status.health <= status.maxHealth &&
    status.conditions.every((condition: any) => typeof condition === 'string') &&
    (status.location === undefined || typeof status.location === 'string');
}

/**
 * ValidationResult-based CharacterStatus validation with detailed error messages.
 * 
 * Validates CharacterStatus objects including health range validation
 * and conditions array validation. Supports partial validation.
 * 
 * @param obj - The object to validate
 * @param options - Validation options
 * @param options.partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidStatus = {
 *   health: 150,    // Cannot exceed maxHealth
 *   maxHealth: 100,
 *   conditions: ['poisoned', 123] // All conditions must be strings
 * };
 * 
 * const result = validateCharacterStatus(invalidStatus);
 * // result.errors will include health range and array content validation
 * ```
 */
export function validateCharacterStatus(obj: unknown, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = [];
  const { partial = false } = options || {};

  if (obj === null || obj === undefined) {
    errors.push('CharacterStatus cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const status = obj as any;

  if (!partial) {
    if (typeof status.health !== 'number') {
      errors.push('Property "health" must be a number');
    } else if (status.health < 0) {
      errors.push('Property "health" must be non-negative');
    }

    if (typeof status.maxHealth !== 'number') {
      errors.push('Property "maxHealth" must be a number');
    } else if (status.maxHealth <= 0) {
      errors.push('Property "maxHealth" must be greater than 0');
    }

    if (typeof status.health === 'number' && typeof status.maxHealth === 'number' && status.health > status.maxHealth) {
      errors.push('Property "health" cannot exceed "maxHealth"');
    }

    if (!Array.isArray(status.conditions)) {
      errors.push('Property "conditions" must be an array');
    } else if (!status.conditions.every((condition: any) => typeof condition === 'string')) {
      errors.push('All elements in "conditions" must be strings');
    }
  } else {
    // Partial validation - only check present properties
    if ('health' in status) {
      if (typeof status.health !== 'number') {
        errors.push('Property "health" must be a number when present');
      } else if (status.health < 0) {
        errors.push('Property "health" must be non-negative');
      }
    }
    
    if ('maxHealth' in status) {
      if (typeof status.maxHealth !== 'number') {
        errors.push('Property "maxHealth" must be a number when present');
      } else if (status.maxHealth <= 0) {
        errors.push('Property "maxHealth" must be greater than 0');
      }
    }
    
    if ('conditions' in status) {
      if (!Array.isArray(status.conditions)) {
        errors.push('Property "conditions" must be an array when present');
      } else if (!status.conditions.every((condition: any) => typeof condition === 'string')) {
        errors.push('All elements in "conditions" must be strings');
      }
    }
  }

  // Optional property validation
  if (status.location !== undefined && typeof status.location !== 'string') {
    errors.push('Property "location" must be a string when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for CharacterPortrait objects.
 * 
 * Validates that an object conforms to the CharacterPortrait interface,
 * including type validation and optional property handling.
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid CharacterPortrait, false otherwise
 * 
 * @example
 * ```typescript
 * const portrait = {
 *   type: 'ai-generated',
 *   url: 'https://example.com/portrait.jpg',
 *   generatedAt: '2025-01-13T10:00:00Z',
 *   prompt: 'A brave knight with kind eyes'
 * };
 * 
 * if (isCharacterPortrait(portrait)) {
 *   console.log(`Portrait type: ${portrait.type}`);
 * }
 * ```
 */
export function isCharacterPortrait(obj: unknown): obj is CharacterPortrait {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const portrait = obj as any;
  return ['ai-generated', 'placeholder'].includes(portrait.type) &&
    (portrait.url === null || typeof portrait.url === 'string') &&
    (portrait.generatedAt === undefined || typeof portrait.generatedAt === 'string') &&
    (portrait.prompt === undefined || typeof portrait.prompt === 'string');
}

/**
 * ValidationResult-based CharacterPortrait validation with detailed error messages.
 * 
 * Validates CharacterPortrait objects including type enum validation
 * and optional property type checking.
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with `valid` boolean and `errors` array
 * 
 * @example
 * ```typescript
 * const invalidPortrait = {
 *   type: 'custom', // Must be 'ai-generated' or 'placeholder'
 *   url: 123       // Must be string or null
 * };
 * 
 * const result = validateCharacterPortrait(invalidPortrait);
 * // result.errors will include type validation failures
 * ```
 */
export function validateCharacterPortrait(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validTypes = ['ai-generated', 'placeholder'];

  if (obj === null || obj === undefined) {
    errors.push('CharacterPortrait cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const portrait = obj as any;

  if (!validTypes.includes(portrait.type)) {
    errors.push(`Property "type" must be one of: ${validTypes.join(', ')}`);
  }

  if (portrait.url !== null && typeof portrait.url !== 'string') {
    errors.push('Property "url" must be null or a string');
  }

  if (portrait.generatedAt !== undefined && typeof portrait.generatedAt !== 'string') {
    errors.push('Property "generatedAt" must be a string when present');
  }

  if (portrait.prompt !== undefined && typeof portrait.prompt !== 'string') {
    errors.push('Property "prompt" must be a string when present');
  }

  return { valid: errors.length === 0, errors };
}
