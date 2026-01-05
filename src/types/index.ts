/**
 * Core type definitions for the Narraitor application
 */

// Re-export all types from their respective files
export type { EntityID, ISODateString, TimestampedEntity, NamedEntity, GeneratedImage } from './common.types';
export type { GenreValue } from './genre.types';
export type { SkillDifficulty } from './skill-difficulty.types';
export type { WorldTemplate } from './world-template.types';
export type { World, WorldAttribute, WorldSkill, WorldSettings, DerivedStatFormula } from './world.types';
export type {
  Character,
  CharacterAttribute,
  CharacterSkill,
  DerivedStat,
  CharacterBackground,
  CharacterRelationship,
  CharacterStatus
} from './character.types';
export type { NPC } from './npc.types';
export type {
  Inventory,
  InventoryItem,
  InventoryCategory,
  StandardInventoryCategory,
  InventoryAcquisitionRecord,
  InventoryAcquisitionMethod,
  InventoryItemCategorization,
  InventoryCategorizationSource
} from './inventory.types';
export type { 
  NarrativeSegment, 
  Decision, 
  DecisionOption, 
  DecisionRequirement, 
  DecisionItemRequirementGroup,
  DecisionItemRequirements,
  RequirementLogic,
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
  LoreUsageSource,
  LoreUsageEventType,
  LoreUsageEvent,
  LoreUsageStats,
  LoreSearchOptions,
  LoreContext,
  EntityMatch,
  EntityResolutionResult,
  LoreMergeAuditEntry
} from './lore.types';
export type { 
  GameSession, 
  SessionState, 
  SavePoint, 
  NarrativeContext,
  SessionLifecycleMetadata,
  SessionLifecycleStatus,
  SessionStatus
} from './session.types';
export type {
  WorldState,
  WorldStateUpdate,
  NPCRelationshipState,
  NPCRelationshipUpdate,
  WorldStateMajorEvent,
  WorldStateMajorEventInput,
  SessionLifecycleSnapshot
} from './world-state.types';
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

// Export runtime error types
export type {
  RuntimeError,
  ErrorSeverity,
  ErrorCategory,
  ErrorComponentContext,
  ErrorStateSnapshot,
  ErrorFilter,
  ErrorStatistics
} from './runtime-error.types';
