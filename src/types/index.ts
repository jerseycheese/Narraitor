/**
 * Core type definitions for the Narraitor application.
 *
 * Architecture note: keep this barrel type-only to avoid runtime coupling and
 * circular dependencies between domains. Only types actually imported via
 * `@/types` are re-exported here; import anything else directly from its leaf
 * module (e.g. `@/types/world.types`).
 */

export type { EntityID } from './common.types';
export type { GenreValue } from './genre.types';
export type { World, WorldAttribute, WorldSkill } from './world.types';
export type { Character } from './character.types';
export type { InventoryItem } from './inventory.types';
export type { NarrativeSegment } from './narrative.types';
export type { JournalEntry, JournalEntryType } from './journal.types';
export type { LoreFact, LoreCategory, LoreUsageSource } from './lore.types';
export type { NarrativeContext } from './session.types';
export type { AITestConfig, AIResponse } from './ai-testing.types';
