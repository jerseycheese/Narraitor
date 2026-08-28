// src/types/turnResolver.types.ts

import type { EntityID } from './common.types';
import type { NarrativeSegment, Decision, DecisionWeight, DecisionOutcome, SkillCheckRoll, EndingTone } from './narrative.types';
import type { Character } from '@/state/characterStore.types';
import type { InventoryItem } from './inventory.types';
import type { WorldThread } from './worldThread.types';
import type { WorldState } from './world-state.types';
import type { NPC } from './npc.types';
import type { ReconciledSegmentNotes } from '@/lib/narrative/applyWorldClockUpdates';

/**
 * Read-only snapshot of the session state a Turn needs. Assembled once at
 * call time from all relevant stores, then frozen. Prompt projections and
 * post-turn assertions consume this instead of scattered getState() calls.
 */
export interface SessionSnapshot {
  readonly sessionId: EntityID;
  readonly worldId: EntityID;
  readonly characterId: EntityID;
  /** 1-based, from sessionSegments.length. */
  readonly turnIndex: number;
  /** Recent window for prompt context, not the full history. */
  readonly segments: readonly NarrativeSegment[];
  /** All session decisions (needed for decision linking and history). */
  readonly decisions: readonly Decision[];
  readonly character: Readonly<Character>;
  readonly inventory: readonly InventoryItem[];
  readonly worldThreads: readonly WorldThread[];
  readonly worldState: Readonly<WorldState> | undefined;
  /** Pre-formatted lore context for prompt projection. */
  readonly loreContext: string;
  readonly npcs: readonly NPC[];
  /** Flattened from character.status.conditions for quick access. */
  readonly conditions: readonly string[];
  readonly endedSessions: Readonly<Record<EntityID, boolean>>;
}

/**
 * What the caller hands TurnResolver to advance the story. The resolver
 * handles everything from here: snapshot, generation, commitment, and
 * reconciliation.
 */
export interface TurnCommand {
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  choiceId: string;
  choiceText: string;
  isCustomInput: boolean;
  skillCheckResults: SkillCheckRoll[];
  skillCheckTags: string[];
  decisionOutcome?: DecisionOutcome;
  decisionWeight?: DecisionWeight;
  /** The segment pacing fields the controller computes before the turn. */
  pacingEscalationRequested: boolean;
  fatalRiskAllowed: boolean;
  isFatalCriticalFailure: boolean;
  generationParams?: {
    desiredTone?: EndingTone;
    includedTopics?: string[];
  };
  /** Abort signal from the controller's timeout race. */
  signal?: AbortSignal;
  /** Streaming chunk callback for progressive rendering. */
  onChunk?: (chunk: string) => void;
}

/**
 * Same shape for the first turn, which has no prior choice.
 */
export interface InitialTurnCommand {
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  generateChoices: boolean;
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

/**
 * The settled result of one turn. Everything in here has been committed to
 * the stores and is safe to read. The next Decision can consume `snapshot`
 * knowing it reflects this turn's mutations.
 */
export interface TurnResult {
  /** The committed, content-gated segment. */
  segment: NarrativeSegment;
  /** Post-turn snapshot with all core mutations applied. */
  snapshot: SessionSnapshot;
  /** Whether a fatal outcome was detected (from world cost or critical failure). */
  isFatal: boolean;
  /** Whether the segment type is 'ending' or carries ending tags. */
  isEnding: boolean;
  /** The reconciled notes stamped onto the segment's metadata. */
  reconciledNotes?: ReconciledSegmentNotes;
}
