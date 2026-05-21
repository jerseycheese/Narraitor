/**
 * Core type definitions for the Narraitor application.
 *
 * Architecture note: keep this barrel type-only to avoid runtime coupling
 * and circular dependencies between domains.
 *
 * Groups tagged `@public` are part of the intentional cross-domain type surface
 * (importable from `@/types`) even when current consumers happen to import them
 * directly from their leaf module. The tag keeps knip from reporting them as
 * unused while preserving the documented public API.
 */

// Re-export all types from their respective files
/** @public */
export type { EntityID, ISODateString, TimestampedEntity, NamedEntity, GeneratedImage } from './common.types';
export type { GenreValue } from './genre.types';
/** @public */
export type { SkillDifficulty } from './skill-difficulty.types';
/** @public */
export type { WorldTemplate } from './world-template.types';
/** @public */
export type { World, WorldAttribute, WorldSkill, WorldSettings, DerivedStatFormula } from './world.types';
/** @public */
export type {
  Character,
  CharacterAttribute,
  CharacterSkill,
  DerivedStat
} from './character.types';
/** @public */
export type { NPC } from './npc.types';
/** @public */
export type {
  Inventory,
  InventoryItem,
  InventoryCategory,
  StandardInventoryCategory,
  InventoryAcquisitionRecord,
  InventoryAcquisitionMethod,
  InventoryItemCategorization
} from './inventory.types';
/** @public */
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
  JournalEntryType
} from './journal.types';
/** @public */
export type {
  LoreFact,
  LoreCategory,
  LoreSource,
  LoreUsageSource,
  LoreUsageEvent,
  LoreUsageStats,
  LoreSearchOptions,
  LoreContext,
  EntityMatch,
  EntityResolutionResult,
  LoreMergeAuditEntry
} from './lore.types';
/** @public */
export type {
  NarrativeContext,
  SessionLifecycleMetadata,
  SessionLifecycleStatus
} from './session.types';
/** @public */
export type {
  WorldState,
  WorldStateUpdate,
  NPCRelationshipState,
  NPCRelationshipUpdate,
  WorldStateMajorEvent,
  WorldStateMajorEventInput
} from './world-state.types';
export type {
  AITestConfig,
  AIResponse
} from './ai-testing.types';

// Export runtime error types
/** @public */
export type {
  RuntimeError,
  ErrorSeverity,
  ErrorCategory,
  ErrorComponentContext,
  ErrorStateSnapshot,
  ErrorFilter,
  ErrorStatistics
} from './runtime-error.types';
