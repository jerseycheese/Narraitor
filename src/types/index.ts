/**
 * Core type definitions for the Narraitor application
 */

// Re-export all types from their respective files
export type { EntityID, ISODateString, TimestampedEntity, NamedEntity } from './common.types';
export type { World, WorldAttribute, WorldSkill, WorldSettings } from './world.types';
export type { 
  Character,
  CharacterAttribute,
  CharacterSkill,
  CharacterBackground,
  CharacterRelationship,
  CharacterStatus
} from './character.types';
export type { 
  Inventory,
  InventoryItem,
  InventoryCategory
} from './inventory.types';
export type { 
  NarrativeSegment, 
  Decision, 
  DecisionOption, 
  DecisionRequirement, 
  Consequence, 
  NarrativeMetadata 
} from './narrative.types';
export type { 
  JournalEntry, 
  JournalEntryType, 
  RelatedEntity, 
  JournalMetadata 
} from './journal.types';
export type {
  LoreFact,
  LoreCategory,
  LoreSource,
  LoreConsistencyCheck,
  LoreSearchOptions,
  LoreExtractionResult,
  LoreContext
} from './lore.types';
export type { 
  GameSession, 
  SessionState, 
  SavePoint, 
  NarrativeContext 
} from './session.types';
export type { 
  AIContext, 
  AIPromptContext, 
  AIConstraint 
} from './ai-context.types';
export type {
  AITestConfig,
  AIRequestLog,
  AIResponse,
  TokenUsage,
  TestScenario
} from './ai-testing.types';

// Export type guards
export { 
  isWorld, 
  isCharacter, 
  isInventoryItem, 
  isNarrativeSegment, 
  isJournalEntry 
} from './type-guards';
