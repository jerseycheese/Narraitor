// src/types/narrative.types.ts

import type { EntityID, TimestampedEntity } from './common.types';
import type { World } from './world.types';
import type { Character } from './character.types';
import type { InventoryAcquisitionMethod, StandardInventoryCategory } from './inventory.types';
import type { ContinuitySegmentNote } from './continuity.types';
import type { WorldClockPromptContext, WorldClockSegmentNote } from './worldThread.types';
import type { WorldCostSegmentNote } from './worldCost.types';

/**
 * Represents a segment of narrative in the game
 */
export interface NarrativeSegment extends TimestampedEntity {
  id: EntityID;
  worldId?: EntityID;
  sessionId?: EntityID;
  content: string;
  type: 'scene' | 'dialogue' | 'action' | 'transition' | 'ending';
  characterIds?: EntityID[];
  decisions?: Decision[];
  metadata: NarrativeMetadata;
  timestamp: Date;
}

/**
 * Decision weight types for visual prominence
 */
export type DecisionWeight = 'minor' | 'major' | 'critical';

/**
 * Represents a decision point in the narrative
 */
export interface Decision {
  id: EntityID;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: EntityID;
  /** Timestamp when the decision option was selected by the player */
  selectedAt?: Date;
  /** ID of the character who made this decision */
  characterId?: EntityID;
  consequences?: Consequence[];
  // Enhanced fields for better decision presentation
  contextSummary?: string;
  decisionWeight?: DecisionWeight;
  narrativeSegmentId?: EntityID;
}

export interface DecisionHistoryEntry {
  decision: Decision;
  outcomeSegment?: NarrativeSegment;
}

/**
 * Choice alignment types for personality-based variety
 */
export type ChoiceAlignment = 'lawful' | 'chaotic' | 'neutral';

/**
 * Represents an option within a decision
 */
export type RequirementLogic = 'all' | 'any';

export interface DecisionItemRequirementGroup {
  /**
   * Logical evaluation for contained requirements.
   * 'all' requires every item, 'any' requires at least one.
   * Defaults to 'all' when omitted.
   */
  logic?: RequirementLogic;
  /**
   * Underlying DecisionRequirement entries with type 'item'.
   */
  requirements: DecisionRequirement[];
}

export type DecisionItemRequirements =
  | DecisionRequirement[]
  | DecisionItemRequirementGroup
  | DecisionItemRequirementGroup[];

export interface DecisionOption {
  id: EntityID;
  text: string;
  requirements?: DecisionRequirement[];
  /**
   * Inventory-based gating requirements.
   * Supports simple arrays (defaults to 'all') or grouped logic blocks.
   */
  requiredItems?: DecisionItemRequirements;
  hint?: string;
  // Custom input support
  isCustomInput?: boolean;
  customText?: string;
  // Choice alignment for personality-based variety
  alignment?: ChoiceAlignment;
  // Consequences applied when this specific option is chosen
  consequences?: Consequence[];
}

/**
 * Represents a requirement for a decision option
 */
export interface DecisionRequirement {
  type: 'attribute' | 'skill' | 'item' | 'relationship';
  targetId: EntityID;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number | string;
}

/**
 * Result of a d20 skill check roll
 * Serialization-safe (string timestamp) for Next.js API routes / state
 */
export interface SkillCheckRoll {
  diceRoll: number;        // Raw d20 result (1-20)
  skillLevel: number;      // Character's skill level (0 if untrained)
  attributeBonus: number;  // Math.round(attribute * 0.1)
  total: number;           // diceRoll + skillLevel + attributeBonus
  dc: number;              // Difficulty Class (required level × 2)
  success: boolean;
  isCriticalSuccess: boolean;  // Natural 20 (auto-success)
  isCriticalFailure: boolean;  // Natural 1 (auto-fail)
  skillId: string;
  skillName: string;
  timestamp: string;       // ISO string, not Date
}

/**
 * Represents a consequence of a decision
 */
export interface Consequence {
  type: 'attribute' | 'skill' | 'item' | 'relationship' | 'narrative' | 'alignment';
  action: 'add' | 'remove' | 'modify';
  targetId: EntityID;
  value: string | number | boolean | Record<string, unknown>;
  description?: string;
}

/**
 * Represents an item acquired during narrative generation
 */
export interface AcquiredItemMetadata {
  name: string;
  description?: string;
  quantity?: number;
  acquisitionMethod?: InventoryAcquisitionMethod;
  /**
   * Category the narrative AI inferred for this item from story context. When
   * present and valid, it lets the acquisition pipeline skip the separate
   * categorization AI call. Validated against StandardInventoryCategory before use.
   */
  categoryHint?: StandardInventoryCategory;
  /**
   * Indicates that this metadata refines the most recently acquired item
   * rather than representing a completely new pickup.
   */
  refinesPrevious?: boolean;
}

/**
 * Represents an item lost or consumed during narrative generation
 */
export interface LostItemMetadata {
  name: string; // Item name for semantic matching
  itemId?: EntityID; // Optional exact ID (takes precedence)
  quantity?: number; // Defaults to 1
  lossReason?: ItemLossReason; // How/why lost
  lossContext?: string; // Narrative context
}

export type ItemLossReason =
  | 'consumed' // Used up (consumables, food, medicine)
  | 'delivered' // Quest completion/delivery to NPC
  | 'stolen' // Taken by NPC/enemy
  | 'dropped' // Abandoned/left behind
  | 'destroyed' // Broken/ruined/damaged beyond use
  | 'sold' // Traded to merchant
  | 'gifted' // Given to NPC as present
  | 'sacrificed' // Ritual/special use
  | 'unknown'; // Fallback when AI doesn't specify

export interface GeneratedCharacterMetadata {
  id: EntityID;
  name: string;
  description?: string;
  role?: string;
  avatarPrompt?: string;
  avatarUrl?: string;
}

/**
 * Debug information for narrative generation (dev mode only)
 * Contains all the context and factors that contributed to generating narrative text
 */
export interface PromptDebugInfo {
  /** The complete prompt text sent to the AI */
  fullPrompt: string;
  /** The template used for generation (e.g., "Scene Template", "Transition Template") */
  templateName: string;
  /** World lore excerpts included in the prompt context */
  loreContext?: Array<{
    loreId: EntityID;
    title: string;
    excerpt: string;
  }>;
  /** Active goals/objectives that influenced the narrative */
  activeGoals?: string[];
  /** Character context included in generation */
  characterContext?: Array<{
    characterId: EntityID;
    name: string;
    relevantTraits?: string[];
  }>;
  /** Inventory items mentioned or used in context */
  inventoryContext?: Array<{
    itemName: string;
    isEquipped?: boolean;
  }>;
  /** Tone and complexity settings applied */
  toneSettings?: {
    mood?: string;
    complexity?: 'simple' | 'moderate' | 'advanced' | 'literary';
    customTone?: string;
  };
  /** Recent player decisions that influenced this segment */
  recentDecisions?: Array<{
    decisionText: string;
    selectedOption: string;
    timestamp: Date;
  }>;
  /** Content from previous segment for continuity */
  previousSegmentContext?: {
    type: string;
    excerpt: string;
  };
  /** Token usage statistics */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** AI model used for generation */
  modelUsed: string;
  /** Timestamp when this prompt was generated */
  generatedAt: Date;
}

/**
 * Metadata for narrative segments (simplified for MVP)
 */
export interface NarrativeMetadata {
  mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral';
  tags: string[];
  /**
   * How the world clock's ledger moved on this turn, stamped after the
   * post-segment extraction reconciles it. Lives on metadata rather than
   * debugInfo so the playtest harness can read it off the segment list.
   */
  worldClock?: WorldClockSegmentNote;
  /** What the world took from the character on this turn, stamped the same way. */
  worldCost?: WorldCostSegmentNote;
  location?: string;
  characterIds?: EntityID[];
  characters?: GeneratedCharacterMetadata[];
  // Dialogue-specific metadata
  speakerId?: EntityID;
  // Ending-specific metadata
  endingId?: string;
  endingData?: StoryEnding;
  tone?: EndingTone;
  // Item acquisition metadata
  itemsAcquired?: AcquiredItemMetadata[];
  // Item loss metadata
  itemsLost?: LostItemMetadata[];
  // Major event tracking
  majorEvent?: string;
  // Decision consequence tracking
  causedByDecisionId?: EntityID;
  causedByDecisionText?: string;
  decisionOutcome?: DecisionOutcome;
  /**
   * Set by the engine, not the model: this segment was generated while the
   * pacing guard was asking for a complication. Asking is what spends the
   * quiet streak, so the guard paces itself instead of firing every turn.
   */
  pacingEscalationRequested?: boolean;
  /**
   * Set by the engine, not the model: this turn's pivotal decision was allowed
   * to end the run. Permission is what gets spent, so the marker lands whether
   * or not the dice took it. Read by turnsSinceFatalRiskAllowed.
   */
  fatalRiskAllowed?: boolean;
  // Continuity guardrail outcome
  continuity?: ContinuitySegmentNote;
  // Debug information (dev mode only)
  debugInfo?: PromptDebugInfo;
}

export type DecisionOutcome =
  | 'success'
  | 'failure'
  | 'mixed'
  | 'critical-success'
  | 'critical-failure';

/**
 * Represents a narrative generation request
 */
export interface NarrativeGenerationRequest {
  worldId: EntityID;
  sessionId: EntityID;
  characterIds: EntityID[];
  narrativeContext?: NarrativeContext;
  generationParameters?: GenerationParameters;
}

/**
 * Represents narrative context for generation
 */
export interface NarrativeContext {
  worldId: EntityID;
  currentSceneId: EntityID;
  characterIds: EntityID[];
  /** All narrative segments in the current session */
  previousSegments: NarrativeSegment[];
  currentTags: string[];
  sessionId: EntityID;
  /** Most recent segments (typically last 3-5) for immediate context. Subset of previousSegments */
  recentSegments?: NarrativeSegment[];
  /** Consecutive segments since the last complication — see computeTurnsSinceComplication */
  turnsSinceComplication?: number;
  currentLocation?: string;
  currentSituation?: string;
  importantEntities?: Array<{
    id: EntityID;
    type: string;
    name: string;
    description?: string;
    avatarUrl?: string | null;
    role?: string;
  }>;
  /** The world clock's open ledger for this turn; absent when the clock is off */
  worldClock?: WorldClockPromptContext;
}

/**
 * Parameters for narrative generation
 */
export interface GenerationParameters {
  desiredLength?: 'short' | 'medium' | 'long';
  tone?: string;
  segmentType?: 'scene' | 'dialogue' | 'action' | 'transition';
  includedTopics?: string[];
  excludedTopics?: string[];
  decisionWeight?: DecisionWeight;
  desiredTone?: EndingTone;
  /**
   * When true, skips the post-processing step that turns AI metadata.itemsAcquired
   * into actual inventory entries. Useful for narrative beats that reference
   * existing items (e.g., item usage) where no new pickups should be recorded.
   */
  disableItemAcquisitionProcessing?: boolean;
  /**
   * When true, skips the post-processing step that turns AI metadata.itemsLost
   * into actual inventory removals. Useful when generating narrative that mentions
   * items but shouldn't trigger removal.
   */
  disableItemLossProcessing?: boolean;
}

/**
 * Result of narrative generation
 */
export interface NarrativeGenerationResult {
  content: string;
  segmentType: 'scene' | 'dialogue' | 'action' | 'transition';
  metadata: {
    characterIds: EntityID[];
    speakerId?: EntityID;
    location?: string;
    mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral';
    tags: string[];
    timestamp?: string;
    characters?: GeneratedCharacterMetadata[];
    // Skill-related metadata for tracking skill usage acknowledgment
    skillsUsed?: Array<{
      skillId: string;
      skillName: string;
      success: boolean;
      difficulty?: number;
    }>;
    // Custom action tracking for implicit skill check situations
    customActionPerformed?: {
      action: string;
      implicitSkills?: string[];
    };
    // Item acquisition metadata
    itemsAcquired?: AcquiredItemMetadata[];
    // Item loss metadata
    itemsLost?: LostItemMetadata[];
    // Major event tracking
    majorEvent?: string;
    // Continuity guardrail outcome
    continuity?: ContinuitySegmentNote;
    // Debug information (dev mode only)
    debugInfo?: PromptDebugInfo;
  };
  choices?: Array<{
    text: string;
    outcome?: string;
    tags?: string[];
    // Enhanced choice data for skill-based decisions
    skillRequirements?: DecisionRequirement[];
    skillHint?: string;
  }>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Types of story endings
 */
export type EndingType = 'player-choice' | 'story-complete' | 'session-limit' | 'character-retirement';

/**
 * Emotional tone of story endings
 */
export type EndingTone = 'triumphant' | 'mysterious' | 'tragic' | 'hopeful';

/**
 * Represents a complete story ending with narrative closure
 */
export interface StoryEnding extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  type: EndingType;
  tone: EndingTone;
  epilogue: string;
  characterLegacy: string;
  worldImpact: string;
  timestamp: Date;
  journalSummary?: string;
  achievements?: string[];
  playTime?: number;
  imageUrl?: string;
  narrativeSegments?: string[];
}

/**
 * Request to generate a story ending
 */
export interface EndingGenerationRequest {
  sessionId: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  endingType: EndingType;
  desiredTone?: EndingTone;
  customPrompt?: string;
  world?: World; // Optional world data passed from client
  character?: Character; // Optional character data passed from client
  narrativeSegments?: NarrativeSegment[]; // Optional narrative segments from client
  journalEntries?: import('./journal.types').JournalEntry[]; // Optional journal entries from client
}

/**
 * Result of ending generation
 */
export interface EndingGenerationResult {
  epilogue: string;
  characterLegacy: string;
  worldImpact: string;
  tone: EndingTone;
  achievements: string[];
  playTime?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
