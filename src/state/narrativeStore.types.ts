import { Decision, NarrativeSegment, StoryEnding, EndingType, EndingTone } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { World } from '../types/world.types';
import type { StoreCharacter } from './characterStore.types';
import type { NarrativeError } from '../lib/narrative/narrativeErrors';

/**
 * Narrative store interface with state and actions.
 *
 * Lives in its own module (rather than narrativeStore.ts) so the action
 * factories in narrativeStore.{segments,decisions,endings}.ts can type
 * against it without importing the store module — which would form an
 * import cycle.
 */
export interface NarrativeStore {
  // State
  segments: Record<EntityID, NarrativeSegment>;
  sessionSegments: Record<EntityID, EntityID[]>;
  decisions: Record<EntityID, Decision>;
  sessionDecisions: Record<EntityID, EntityID[]>;
  endedSessions: Record<EntityID, boolean>; // Track sessions that have ended with an ending
  currentEnding: StoryEnding | null;
  isGeneratingEnding: boolean;
  endingError: string | null;
  error: string | null;
  /**
   * Classified failure from the live story-generation loop (timeout, network,
   * provider 429/5xx, bad key). Holds the already-categorized NarrativeError so
   * the choices column can show transient-vs-terminal copy + a Retry without
   * re-deriving retryability. Transient UI state — intentionally not persisted.
   */
  generationError: NarrativeError | null;
  loading: boolean;
  _hasHydrated: boolean; // Track if persistence has loaded

  // Actions
  addSegment: (sessionId: EntityID, segment: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>, options?: { resolverManaged?: boolean }) => EntityID;
  updateSegment: (segmentId: EntityID, updates: Partial<NarrativeSegment>) => void;
  deleteSegment: (segmentId: EntityID) => void;

  // Decision actions
  addDecision: (sessionId: EntityID, decision: Omit<Decision, 'id'>) => EntityID;
  updateDecision: (decisionId: EntityID, updates: Partial<Decision>) => void;
  /** Records a player's choice selection with timestamp and character association */
  selectDecisionOption: (decisionId: EntityID, optionId: EntityID, characterId?: EntityID) => void;
  getSessionDecisions: (sessionId: EntityID) => Decision[];
  getLatestDecision: (sessionId: EntityID) => Decision | null;

  // Query actions
  getSessionSegments: (sessionId: EntityID) => NarrativeSegment[];

  // State management
  reset: () => void;
  clearSessionSegments: (sessionId: EntityID) => void;
  clearSessionDecisions: (sessionId: EntityID) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setGenerationError: (error: NarrativeError | null) => void;
  clearGenerationError: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Ending actions
  generateEnding: (endingType: EndingType, params: {
    sessionId: EntityID;
    characterId: EntityID;
    worldId: EntityID;
    desiredTone?: EndingTone;
    customPrompt?: string;
    world?: World;
    character?: StoreCharacter;
  }) => Promise<void>;
  clearEnding: () => void;
  setCurrentEnding: (ending: StoryEnding | null) => void;
  updateCurrentEnding: (updater: (ending: StoryEnding | null) => StoryEnding | null) => void;
  saveEndingToHistory: () => void;
  hasActiveEnding: () => boolean;
  getEndingForSession: (sessionId: EntityID) => StoryEnding | null;
  isSessionEnded: (sessionId: EntityID) => boolean;
  markSessionEnded: (sessionId: EntityID) => void;
}

/** Shared set/get shapes for the narrativeStore action factories. */
export type NarrativeStoreSet = (
  partial: Partial<NarrativeStore> | ((state: NarrativeStore) => Partial<NarrativeStore>)
) => void;
export type NarrativeStoreGet = () => NarrativeStore;
