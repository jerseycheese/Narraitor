import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Decision, NarrativeSegment, StoryEnding, EndingType, EndingTone, ChoiceAlignment, NarrativeMetadata, Consequence, PromptDebugInfo } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { World } from '../types/world.types';
import { Character } from './characterStore';
import { ChoiceTypePreference } from '../types/personalization.types';
import { generateUniqueId, getTimestamp, safeTrim } from '../lib/utils';
// IMPORTANT: Do not import AI generators directly in client code.
// All AI calls must go through server/API routes per project guidelines.
import { logger } from '../lib/utils/logger';
import { normalizeText, NORM_DESC } from '../lib/utils/textNormalization';
import { playerDecisionTracker } from '../lib/ai/playerDecisionTracker';
import { createIndexedDBStorage } from './persistence';
import {
  NPCRelationshipUpdate,
  WorldStateMajorEventInput,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipUpdate,
} from '../types/world-state.types';

let worldStoreModule: typeof import('./worldStore') | null = null;
let sessionStoreModule: typeof import('./sessionStore') | null = null;
let characterStoreModule: typeof import('./characterStore') | null = null;
let journalStoreModule: typeof import('./journalStore') | null = null;

const SEGMENT_SNIPPET_MAX_LENGTH = 220;

/**
 * Serialized version of PromptDebugInfo for IndexedDB storage.
 * Date fields are converted to ISO strings for persistence.
 */
type SerializedPromptDebugInfo = Omit<PromptDebugInfo, 'generatedAt' | 'recentDecisions'> & {
  generatedAt: string;
  recentDecisions?: Array<{
    decisionText: string;
    selectedOption: string;
    timestamp: string;
  }>;
};

interface WorldStateUpdateParams {
  newSegment: NarrativeSegment;
  originalSegmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>;
  finalMetadata: NarrativeMetadata;
  sessionId: EntityID;
}

async function applyWorldStateThreadUpdates({
  newSegment,
  originalSegmentData,
  finalMetadata,
  sessionId,
}: WorldStateUpdateParams): Promise<void> {
  try {
    if (!sessionStoreModule) {
      sessionStoreModule = await import('./sessionStore');
    }
    if (!worldStoreModule) {
      worldStoreModule = await import('./worldStore');
    }
    if (!characterStoreModule) {
      characterStoreModule = await import('./characterStore');
    }

    const { useSessionStore } = sessionStoreModule!;
    const { useWorldStore } = worldStoreModule!;
    const { useCharacterStore } = characterStoreModule!;

    const sessionStore = useSessionStore.getState();
    const worldStore = useWorldStore.getState();
    const characterStore = useCharacterStore.getState();

    const effectiveWorldId =
      newSegment.worldId ??
      originalSegmentData.worldId ??
      sessionStore.worldId ??
      worldStore.currentWorldId;

    if (!effectiveWorldId) {
      return;
    }

    const activeCharacterId =
      sessionStore.characterId ??
      originalSegmentData.characterIds?.[0] ??
      finalMetadata.characterIds?.[0] ??
      characterStore.currentCharacterId;

    if (!activeCharacterId) {
      return;
    }

    const rosterIds = characterStore.getWorldRoster
      ? characterStore.getWorldRoster(effectiveWorldId)
      : characterStore.getCharactersByWorld
        ? characterStore.getCharactersByWorld(effectiveWorldId).map((character) => character.id)
        : Object.values(characterStore.characters || {})
            .filter((character) => character.worldId === effectiveWorldId)
            .map((character) => character.id);

    if (!Array.isArray(rosterIds) || rosterIds.length === 0) {
      return;
    }

    const referencedIds = new Set<EntityID>();
    (originalSegmentData.characterIds ?? []).forEach((id) => referencedIds.add(id));
    (finalMetadata.characterIds ?? []).forEach((id) => referencedIds.add(id));
    (finalMetadata.characters ?? []).forEach((character) => {
      if (character.id) {
        referencedIds.add(character.id);
      }
    });

    const otherPlayerCharacterIds = rosterIds.filter(
      (id) => id !== activeCharacterId && referencedIds.has(id)
    );

    const normalizedContent = newSegment.content?.trim();
    if (!normalizedContent) {
      return;
    }

    const summarySnippet = normalizedContent.length > SEGMENT_SNIPPET_MAX_LENGTH
      ? `${normalizedContent.slice(0, SEGMENT_SNIPPET_MAX_LENGTH - 3)}...`
      : normalizedContent;

    if (!summarySnippet) {
      return;
    }

    const threadId = `thread-${activeCharacterId}`;
    const crossReferences = otherPlayerCharacterIds.map((otherId) => ({
      characterId: otherId,
      summary: summarySnippet,
      sessionId,
      lastReferencedAt: getTimestamp(),
    }));

    const threadUpdate: PlayerCharacterThreadUpdate = {
      id: threadId,
      characterId: activeCharacterId,
      summary: summarySnippet,
      appendHighlights: [summarySnippet],
      sessionIds: [sessionId],
      crossCharacterReferences: crossReferences.length > 0 ? crossReferences : undefined,
    };

    let relationshipUpdates: Record<EntityID, Record<EntityID, CharacterRelationshipUpdate>> | undefined;

    if (otherPlayerCharacterIds.length > 0) {
      const timestamp = getTimestamp();
      relationshipUpdates = {};

      otherPlayerCharacterIds.forEach((otherId) => {
        if (!relationshipUpdates![activeCharacterId]) {
          relationshipUpdates![activeCharacterId] = {};
        }
        relationshipUpdates![activeCharacterId][otherId] = {
          sentimentDelta: 2,
          trustDelta: 1,
          tensionDelta: 0,
          lastInteraction: timestamp,
          sessionId,
        };

        if (!relationshipUpdates![otherId]) {
          relationshipUpdates![otherId] = {};
        }
        relationshipUpdates![otherId][activeCharacterId] = {
          sentimentDelta: 1,
          trustDelta: 1,
          tensionDelta: 0,
          lastInteraction: timestamp,
          sessionId,
        };
      });
    }

    const updatePayload: {
      playerCharacterThreads: Record<EntityID, PlayerCharacterThreadUpdate>;
      characterRelationships?: Record<EntityID, Record<EntityID, CharacterRelationshipUpdate>>;
      majorEvents?: WorldStateMajorEventInput[];
    } = {
      playerCharacterThreads: {
        [threadId]: threadUpdate,
      },
    };

    if (relationshipUpdates) {
      updatePayload.characterRelationships = relationshipUpdates;
    }

    // Add major event if AI identified one
    if (finalMetadata.majorEvent) {
      updatePayload.majorEvents = [{
        id: generateUniqueId('event'),
        description: finalMetadata.majorEvent,
        timestamp: getTimestamp(),
        characterId: activeCharacterId,
      }];
    }

    worldStore.updateWorldState(effectiveWorldId, updatePayload, sessionId);
  } catch (error) {
    logger.debug(
      '[NarrativeStore]',
      'World state thread update skipped:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}


/**
 * Narrative store interface with state and actions
 */
interface NarrativeStore {
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
  loading: boolean;
  _hasHydrated: boolean; // Track if persistence has loaded

  // Actions
  addSegment: (sessionId: EntityID, segment: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>) => EntityID;
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
    character?: Character;
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

// Initial state
const getInitialState = () => ({
  segments: {},
  sessionSegments: {},
  decisions: {},
  sessionDecisions: {},
  endedSessions: {},
  currentEnding: null,
  isGeneratingEnding: false,
  endingError: null,
  error: null,
  loading: false,
  _hasHydrated: false,
});

const initialState = getInitialState();

const normalizeLocationKey = (value: string): string =>
  safeTrim(value)
    .replace(/[“”"‘’'`´]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

/**
 * Maps choice alignment to appropriate choice type preference
 */
const mapAlignmentToChoiceType = (alignment?: ChoiceAlignment): ChoiceTypePreference => {
  switch (alignment) {
    case 'lawful': return 'diplomatic';
    case 'chaotic': return 'aggressive';
    case 'neutral':
    default: return 'neutral';
  }
};

/**
 * AI-based choice type inference (placeholder for future enhancement)
 * TODO: Implement AI-based choice analysis for choices without explicit alignment
 * See follow-up issue for enhanced choice categorization using AI
 */
const inferChoiceTypeFromText = (): ChoiceTypePreference => {
  // For choices without explicit alignment, return neutral
  // The alignment-based mapping handles the majority of cases effectively
  // AI-based inference will be implemented in a follow-up enhancement
  return 'neutral';
};

interface ExtractedWorldStateImpact {
  relationships: Record<EntityID, NPCRelationshipUpdate>;
  events: WorldStateMajorEventInput[];
}

type DecisionWorldStatePayload = {
  worldId: EntityID;
  sessionId: EntityID;
  relationships: Record<EntityID, NPCRelationshipUpdate>;
  events: WorldStateMajorEventInput[];
};

const MAJOR_EVENT_PATTERNS: RegExp[] = [
  /world[-\s]?changing/i,
  /major\s+event/i,
  /kingdom\s+(?:falls|celebrates|rejoices|crumbles)/i,
  /celebration/i,
  /catastrophe/i,
  /disaster/i,
  /uprising/i,
  /war\s+erupts/i,
  /reputation\s+(?:soars|plummets|spreads)/i,
];

const parseNumericValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
};

const ensureRelationshipUpdate = (
  relationships: Record<EntityID, NPCRelationshipUpdate>,
  npcId: EntityID,
  timestamp: string
): NPCRelationshipUpdate => {
  const existing = relationships[npcId];
  if (existing) {
    if (!existing.lastInteraction) {
      existing.lastInteraction = timestamp;
    }
    return existing;
  }

  const update: NPCRelationshipUpdate = { lastInteraction: timestamp };
  relationships[npcId] = update;
  return update;
};

const queueMajorEvent = (
  description: string | undefined,
  characterId: EntityID | undefined,
  processed: Set<string>,
  events: WorldStateMajorEventInput[]
) => {
  const trimmed = safeTrim(description ?? '');
  if (!trimmed) {
    return;
  }

  const key = trimmed.toLowerCase();
  if (processed.has(key)) {
    return;
  }

  processed.add(key);
  events.push({
    id: generateUniqueId('event'),
    description: trimmed,
    timestamp: getTimestamp(),
    characterId: (characterId ?? 'unknown-character') as EntityID,
  });
};

const extractWorldStateImpacts = (
  decision: Decision,
  selectedOption: Decision['options'][number],
  characterId?: EntityID
): ExtractedWorldStateImpact => {
  const relationships: Record<EntityID, NPCRelationshipUpdate> = {};
  const events: WorldStateMajorEventInput[] = [];
  const processedDescriptions = new Set<string>();
  const timestamp = getTimestamp();

  const handleConsequence = (consequence?: Consequence) => {
    if (!consequence) {
      return;
    }

    if (consequence.type === 'relationship') {
      const npcId = consequence.targetId;
      if (!npcId) {
        return;
      }

      const update = ensureRelationshipUpdate(relationships, npcId, timestamp);
      const value = consequence.value;

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.trust === 'number') {
          update.trust = record.trust;
        }
        if (typeof record.sentiment === 'number') {
          update.sentiment = record.sentiment;
        }
        if (typeof record.trustDelta === 'number') {
          update.trustDelta = (update.trustDelta ?? 0) + (record.trustDelta as number);
        }
        if (typeof record.sentimentDelta === 'number') {
          update.sentimentDelta = (update.sentimentDelta ?? 0) + (record.sentimentDelta as number);
        }
        if (typeof record.lastInteraction === 'string') {
          update.lastInteraction = record.lastInteraction;
        }
      } else {
        const numeric = parseNumericValue(value);
        if (typeof numeric === 'number') {
          if (consequence.action === 'add') {
            update.trustDelta = (update.trustDelta ?? 0) + numeric;
          } else if (consequence.action === 'remove') {
            update.trustDelta = (update.trustDelta ?? 0) - numeric;
          } else {
            update.trust = numeric;
          }
        }
      }

      update.lastInteraction = update.lastInteraction ?? timestamp;

      if (typeof consequence.description === 'string') {
        queueMajorEvent(consequence.description, characterId, processedDescriptions, events);
      }
      return;
    }

    if (consequence.type === 'narrative') {
      const description = typeof consequence.value === 'string'
        ? consequence.value
        : consequence.description;
      queueMajorEvent(description, characterId, processedDescriptions, events);
    }
  };

  const optionConsequences = (selectedOption as unknown as { consequences?: Consequence[] }).consequences || [];
  optionConsequences.forEach(handleConsequence);
  (decision.consequences ?? []).forEach(handleConsequence);

  const candidateTexts: string[] = [];
  const optionText = safeTrim(selectedOption.text || '');
  if (optionText) candidateTexts.push(optionText);

  const customText = safeTrim((selectedOption as { customText?: string }).customText ?? '');
  if (customText) candidateTexts.push(customText);

  const hintText = safeTrim((selectedOption as { hint?: string }).hint ?? '');
  if (hintText) candidateTexts.push(hintText);

  const decisionPrompt = safeTrim(decision.prompt || '');
  if (decisionPrompt) candidateTexts.push(decisionPrompt);

  const consequenceDescriptions = [...optionConsequences, ...(decision.consequences ?? [])]
    .map((cons) => safeTrim(cons?.description || (typeof cons?.value === 'string' ? cons.value : '')))
    .filter(Boolean) as string[];

  candidateTexts.push(...consequenceDescriptions);

  candidateTexts.forEach(text => {
    const sentences = text.split(/(?<=[.!?])\s+/u);
    sentences.forEach(sentence => {
      const trimmed = safeTrim(sentence);
      if (!trimmed) {
        return;
      }

      if (MAJOR_EVENT_PATTERNS.some(pattern => pattern.test(trimmed))) {
        queueMajorEvent(trimmed, characterId, processedDescriptions, events);
      }
    });
  });

  for (const [npcId, update] of Object.entries(relationships)) {
    const meaningful =
      typeof update.sentiment !== 'undefined' ||
      typeof update.sentimentDelta !== 'undefined' ||
      typeof update.trust !== 'undefined' ||
      typeof update.trustDelta !== 'undefined';

    if (!meaningful) {
      delete relationships[npcId];
    } else if (!update.lastInteraction) {
      update.lastInteraction = timestamp;
    }
  }

  return {
    relationships,
    events,
  };
};

/**
 * Extracts narrative context from decision prompt and segments
 */
const extractDecisionContext = (
  prompt: string, 
  segments: NarrativeSegment[]
): {
  location?: string;
  situation?: string;
  charactersPresent?: string[];
} => {
  const context: {
    location?: string;
    situation?: string;
    charactersPresent?: string[];
  } = {};

  // Extract location from segments (most recent with location)
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (segment?.metadata?.location) {
      context.location = segment.metadata.location;
      break;
    }
  }

  // Extract characters from segments (collect all mentioned characters)
  const allCharacterIds = new Set<string>();
  segments.forEach(segment => {
    if (segment?.characterIds) {
      segment.characterIds.forEach(id => allCharacterIds.add(id));
    }
    if (segment?.metadata?.characterIds) {
      segment.metadata.characterIds.forEach(id => allCharacterIds.add(id));
    }
  });

  // Extract characters from prompt text (capitalized names, possibly with hyphens/apostrophes)
  const characterRegex = /\b([A-Z][a-z]+(?:[-' ][A-Z][a-z]+)*)\b/g;
  const promptCharacterMatches = prompt.match(characterRegex) || [];
  promptCharacterMatches.forEach(char => allCharacterIds.add(char));

  if (allCharacterIds.size > 0) {
    context.charactersPresent = Array.from(allCharacterIds);
  }

  // Use prompt as situation context
  context.situation = prompt;

  return context;
};

// Narrative Store implementation with persistence
export const useNarrativeStore = create<NarrativeStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Add segment
  addSegment: (sessionId, segmentData) => {
    const normalizedContent = normalizeText(segmentData.content || '', NORM_DESC);
    if (!normalizedContent) {
      throw new Error('Segment content is required');
    }

    // Prevent adding segments to ended sessions
    if (get().isSessionEnded(sessionId)) {
      throw new Error('Cannot add segments to an ended session');
    }

    const segmentId = generateUniqueId('segment');
    const now = getTimestamp();

    const sessionSegmentIds = get().sessionSegments[sessionId] || [];
    const previousSegmentId =
      sessionSegmentIds.length > 0
        ? sessionSegmentIds[sessionSegmentIds.length - 1]
        : null;
    const previousSegment = previousSegmentId
      ? get().segments[previousSegmentId]
      : undefined;

    let metadata = segmentData.metadata
      ? { ...segmentData.metadata }
      : undefined;

    if (metadata?.location) {
      const cleanedLocation = safeTrim(metadata.location).replace(/\s+/g, ' ');

      if (!cleanedLocation) {
        const nextMetadata = { ...metadata };
        delete nextMetadata.location;
        metadata = Object.keys(nextMetadata).length > 0 ? nextMetadata : undefined;
      } else {
        const previousLocation = previousSegment?.metadata?.location;

        if (
          previousLocation &&
          normalizeLocationKey(previousLocation) === normalizeLocationKey(
            cleanedLocation
          )
        ) {
          metadata = {
            ...metadata,
            location: previousLocation,
          };
        } else {
          metadata = {
            ...metadata,
            location: cleanedLocation,
          };
        }
      }
    }

    const finalMetadata: NarrativeMetadata = {
      mood: metadata?.mood,
      tags: metadata?.tags ?? [],
      location: metadata?.location,
      characterIds: metadata?.characterIds,
      characters: metadata?.characters,
      speakerId: metadata?.speakerId,
      itemsAcquired: metadata?.itemsAcquired,
      endingId: metadata?.endingId,
      endingData: metadata?.endingData,
      tone: metadata?.tone,
      majorEvent: metadata?.majorEvent,
      debugInfo: metadata?.debugInfo, // Preserve debug info from AI generation
    };

    const newSegment: NarrativeSegment = {
      ...segmentData,
      metadata: finalMetadata,
      content: normalizeText(segmentData.content, NORM_DESC),
      id: segmentId,
      sessionId,
      createdAt: now,
    };

    set((state) => {
      // Initialize session segments if not exists
      const sessionSegments = state.sessionSegments[sessionId] || [];
      
      return {
        segments: {
          ...state.segments,
          [segmentId]: newSegment,
        },
        sessionSegments: {
          ...state.sessionSegments,
          [sessionId]: [...sessionSegments, segmentId],
        },
      };
    });

    // Update the saved session's narrative count
    import('../state/sessionStore').then(({ useSessionStore }) => {
      const sessionStore = useSessionStore.getState();
      const sessionSegments = get().sessionSegments[sessionId] || [];
      sessionStore.updateSavedSessionNarrativeCount(sessionId, sessionSegments.length);
    }).catch((error) => {
      logger.error('[NarrativeStore]', 'Failed to update session narrative count:', error);
    });

    // Process the segment for goal extraction asynchronously
    // Import goalStore dynamically to avoid circular dependencies
    Promise.resolve().then(async () => {
      try {
        const goalStoreModule = await import('./goalStore');
        const goalStore = goalStoreModule.useGoalStore.getState();
        const result = await goalStore.processSegmentForGoals(segmentId, segmentData.metadata?.characterIds?.[0]);
        logger.debug('[NarrativeStore]', 'Goal processing result:', result);
      } catch (error) {
        // Silently fail goal processing if goalStore is not available
        // This is not critical for narrative functionality
        logger.debug('[NarrativeStore]', 'Goal processing skipped:', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    void applyWorldStateThreadUpdates({
      newSegment,
      originalSegmentData: segmentData,
      finalMetadata,
      sessionId,
    });

    return segmentId;
  },

  // Update segment
  updateSegment: (segmentId, updates) => set((state) => {
    if (!state.segments[segmentId]) {
      return { error: 'Segment not found' };
    }

    const updatedSegment: NarrativeSegment = {
      ...state.segments[segmentId],
      ...updates,
    };

    return {
      segments: {
        ...state.segments,
        [segmentId]: updatedSegment,
      },
      error: null,
    };
  }),

  // Delete segment
  deleteSegment: (segmentId) => set((state) => {
    const segment = state.segments[segmentId];
    if (!segment) {
      return state;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [segmentId]: _deletedSegment, ...remainingSegments } = state.segments;
    
    // Remove from session segments
    const sessionId = segment.sessionId;
    const updatedSessionSegments = sessionId ? (state.sessionSegments[sessionId]?.filter(
      (id) => id !== segmentId
    ) || []) : [];

    return {
      segments: remainingSegments,
      sessionSegments: sessionId ? {
        ...state.sessionSegments,
        [sessionId]: updatedSessionSegments,
      } : state.sessionSegments,
    };
  }),

  // Get session segments
  getSessionSegments: (sessionId) => {
    const state = get();
    const segmentIds = state.sessionSegments[sessionId] || [];
    return segmentIds.map((id) => state.segments[id]).filter(Boolean);
  },

  // State management actions
  reset: () => set(() => initialState),
  
  // Clear a specific session's segments
  clearSessionSegments: (sessionId) => {
    const state = get();
    const segmentIdsToRemove = state.sessionSegments[sessionId] || [];
    
    if (segmentIdsToRemove.length === 0) return;
    
    // Remove segments from the segments record
    const updatedSegments = { ...state.segments };
    segmentIdsToRemove.forEach(id => {
      delete updatedSegments[id];
    });
    
    // Remove session from sessionSegments
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sessionId]: removedSession, ...remainingSessionSegments } = state.sessionSegments;
    
    set({
      segments: updatedSegments,
      sessionSegments: remainingSessionSegments
    });
  },
  
  // Decision actions
  addDecision: (sessionId, decisionData) => {
    const decisionId = generateUniqueId('decision');
    
    const newDecision: Decision = {
      ...decisionData,
      id: decisionId
    };

    set((state) => {
      // Initialize session decisions if not exists
      const sessionDecisions = state.sessionDecisions[sessionId] || [];
      
      return {
        decisions: {
          ...state.decisions,
          [decisionId]: newDecision,
        },
        sessionDecisions: {
          ...state.sessionDecisions,
          [sessionId]: [...sessionDecisions, decisionId],
        },
      };
    });

    return decisionId;
  },
  
  updateDecision: (decisionId, updates) => set((state) => {
    if (!state.decisions[decisionId]) {
      return { error: 'Decision not found' };
    }

    const updatedDecision: Decision = {
      ...state.decisions[decisionId],
      ...updates,
    };

    return {
      decisions: {
        ...state.decisions,
        [decisionId]: updatedDecision,
      },
      error: null,
    };
  }),
  
  selectDecisionOption: (decisionId, optionId, characterId) => {
    let worldStatePayload: DecisionWorldStatePayload | undefined;

    set((state) => {
      if (!state.decisions[decisionId]) {
        return { error: 'Decision not found' };
      }

      const decision = state.decisions[decisionId];
      const selectedOption = decision.options.find(opt => opt.id === optionId);
      
      if (!selectedOption) {
        return { error: 'Selected option not found' };
      }

      const updatedDecision: Decision = {
        ...decision,
        selectedOptionId: optionId,
        selectedAt: new Date(),
        characterId,
      };

      let sessionId: EntityID | null = null;
      let worldId: EntityID | null = null;

      try {
        for (const [sId, decisionIds] of Object.entries(state.sessionDecisions)) {
          if (decisionIds.includes(decisionId)) {
            sessionId = sId;
            break;
          }
        }

        if (sessionId) {
          const segmentIds = state.sessionSegments[sessionId] || [];
          for (const segmentId of segmentIds) {
            const segment = state.segments[segmentId];
            if (segment?.worldId) {
              worldId = segment.worldId;
              break;
            }
          }
        }

        if (sessionId && characterId) {
          let choiceType: ChoiceTypePreference = 'neutral';
          if (selectedOption.alignment) {
            choiceType = mapAlignmentToChoiceType(selectedOption.alignment);
          } else {
            choiceType = inferChoiceTypeFromText();
          }

          const sessionSegmentIds = state.sessionSegments[sessionId] || [];
          const sessionSegments = sessionSegmentIds.map(id => state.segments[id]).filter(Boolean);
          const context = extractDecisionContext(decision.prompt, sessionSegments);

          playerDecisionTracker.recordDecision(
            decision.prompt,
            selectedOption.text,
            choiceType,
            sessionId,
            worldId || 'unknown-world',
            context
          );
        }
      } catch (error) {
        logger.warn('Failed to track player decision:', error);
      }

      if (sessionId && worldId) {
        const impacts = extractWorldStateImpacts(decision, selectedOption, characterId);
        if (Object.keys(impacts.relationships).length > 0 || impacts.events.length > 0) {
          worldStatePayload = {
            worldId,
            sessionId,
            relationships: impacts.relationships,
            events: impacts.events,
          };
        }
      }

      return {
        decisions: {
          ...state.decisions,
          [decisionId]: updatedDecision,
        },
        error: null,
      };
    });

    const payload = worldStatePayload;
    if (payload) {
      try {
        if (!worldStoreModule) {
          worldStoreModule = eval('require("./worldStore")');
        }
        const { useWorldStore } = worldStoreModule!;
        useWorldStore.getState().updateWorldState(
          payload.worldId,
          {
            npcRelationships: payload.relationships,
            majorEvents: payload.events,
          },
          payload.sessionId
        );
      } catch (error) {
        logger.warn('Failed to apply world state update from decision', error);
      }
    }
  },
  
  getSessionDecisions: (sessionId) => {
    const state = get();
    const decisionIds = state.sessionDecisions[sessionId] || [];
    return decisionIds.map((id) => state.decisions[id]).filter(Boolean);
  },
  
  getLatestDecision: (sessionId) => {
    const state = get();
    const decisionIds = state.sessionDecisions[sessionId] || [];
    if (decisionIds.length === 0) return null;
    
    const latestDecisionId = decisionIds[decisionIds.length - 1];
    return state.decisions[latestDecisionId] || null;
  },
  
  clearSessionDecisions: (sessionId) => {
    const state = get();
    const decisionIdsToRemove = state.sessionDecisions[sessionId] || [];
    
    if (decisionIdsToRemove.length === 0) return;
    
    // Remove decisions from the decisions record
    const updatedDecisions = { ...state.decisions };
    decisionIdsToRemove.forEach(id => {
      delete updatedDecisions[id];
    });
    
    // Remove session from sessionDecisions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sessionId]: removedSession, ...remainingSessionDecisions } = state.sessionDecisions;
    
    set({
      decisions: updatedDecisions,
      sessionDecisions: remainingSessionDecisions
    });
  },
  
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
  
  // Ending actions
  generateEnding: async (endingType, params) => {
    set({ isGeneratingEnding: true, endingError: null });

    try {
      // Get narrative segments and journal entries for this session
      // Only send the last 10 segments and 5 journal entries to avoid payload size issues
      const state = get();
      const allSegments = Object.values(state.segments)
        .filter(segment => segment.sessionId === params.sessionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const narrativeSegments = allSegments.slice(-10); // Last 10 segments only

      // Lazy load journal store to avoid circular dependencies
      if (!journalStoreModule) {
        journalStoreModule = await import('./journalStore');
      }
      const journalState = journalStoreModule.useJournalStore.getState();
      const allJournalEntries = journalState.entries
        ? Object.values(journalState.entries).filter(entry => entry.sessionId === params.sessionId)
        : [];
      const journalEntries = allJournalEntries.slice(-5); // Last 5 journal entries only

      // Route through server API to keep AI usage server-side and enable test mocking
      const response = await fetch('/api/narrative/ending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.sessionId,
          characterId: params.characterId,
          worldId: params.worldId,
          endingType,
          desiredTone: params.desiredTone,
          customPrompt: params.customPrompt,
          world: params.world, // Pass the world data from client
          character: params.character, // Pass the character data from client
          narrativeSegments, // Pass narrative segments from client
          journalEntries, // Pass journal entries from client
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errText || 'Failed to load ending'}`);
      }

      const json = await response.json();
      const result = json?.data ?? json; // Support both {success,data} and direct payload

      if (!result || !result.epilogue || !result.characterLegacy || !result.worldImpact) {
        throw new Error('Invalid ending payload from API');
      }

      const endingId = generateUniqueId('ending');
      const now = new Date();
      const isoNow = now.toISOString();

      const ending: StoryEnding = {
        id: endingId,
        sessionId: params.sessionId,
        characterId: params.characterId,
        worldId: params.worldId,
        type: endingType,
        tone: result.tone,
        epilogue: result.epilogue,
        characterLegacy: result.characterLegacy,
        worldImpact: result.worldImpact,
        timestamp: now,
        createdAt: isoNow,
        updatedAt: isoNow,
        achievements: result.achievements || [],
        playTime: result.playTime,
      };

      set({
        currentEnding: ending,
        isGeneratingEnding: false,
        endingError: null,
      });

      // Mark the session as ended to prevent further generation
      get().markSessionEnded(params.sessionId);
    } catch (error) {
      logger.error('Failed to load ending', { error, endingType, params });

      set({
        currentEnding: null,
        isGeneratingEnding: false,
        endingError: `Unable to load ending: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
  
  clearEnding: () => set({ currentEnding: null, endingError: null }),

  setCurrentEnding: (ending) => set({ currentEnding: ending, endingError: null }),

  updateCurrentEnding: (updater) => set((state) => ({
    currentEnding: updater(state.currentEnding),
    endingError: null
  })),

  saveEndingToHistory: () => {
    const state = get();
    const ending = state.currentEnding;
    if (!ending) return;
    
    // Create a special segment for the ending
    const endingSegmentId = generateUniqueId('segment');
    const now = new Date();
    const isoNow = now.toISOString();
    
    const endingSegment: NarrativeSegment = {
      id: endingSegmentId,
      sessionId: ending.sessionId,
      worldId: ending.worldId,
      content: ending.epilogue,
      type: 'ending',
      timestamp: now,
      createdAt: isoNow,
      updatedAt: isoNow,
      metadata: {
        tags: ['ending', ending.type],
        mood: 'emotional',
        tone: ending.tone,
        endingId: ending.id,
        endingData: ending
      }
    };
    
    set((state) => {
      const sessionSegments = state.sessionSegments[ending.sessionId] || [];
      
      return {
        segments: {
          ...state.segments,
          [endingSegmentId]: endingSegment
        },
        sessionSegments: {
          ...state.sessionSegments,
          [ending.sessionId]: [...sessionSegments, endingSegmentId]
        }
      };
    });
  },
  
  hasActiveEnding: () => {
    return get().currentEnding !== null;
  },
  
  getEndingForSession: (sessionId) => {
    const state = get();
    
    // Check if the current ending is for this session
    if (state.currentEnding?.sessionId === sessionId) {
      return state.currentEnding;
    }
    
    // Look for ending in all segments (not just session segments)
    // This handles cases where segments are added directly without sessionSegments mapping
    const allSegments = Object.values(state.segments);
    const endingSegment = allSegments.find(seg => 
      seg.sessionId === sessionId &&
      seg.type === 'ending' &&
      seg.metadata?.tags?.includes('ending') && 
      seg.metadata?.endingData
    );
    
    return endingSegment?.metadata.endingData as StoryEnding || null;
  },
  
  // Session ending tracking
  isSessionEnded: (sessionId) => {
    return get().endedSessions[sessionId] === true;
  },
  
  markSessionEnded: (sessionId) => {
    set((state) => ({
      endedSessions: {
        ...state.endedSessions,
        [sessionId]: true,
      }
    }));

    try {
      if (!sessionStoreModule) {
        sessionStoreModule = eval('require("./sessionStore")');
      }
      const { useSessionStore } = sessionStoreModule!;
      useSessionStore.getState().setSessionLifecycleStatus(sessionId, 'ended');
    } catch (error) {
      logger.warn('Failed to propagate session lifecycle status on ending', error);
    }
  },

  setHasHydrated: (hasHydrated: boolean) => {
    set({ _hasHydrated: hasHydrated });
  },
}),
{
  name: 'narraitor-narrative-store',
  storage: createIndexedDBStorage(),
  version: 1,
  // Persist narrative data to maintain story progress across browser refreshes
  partialize: (state) => {
    // Convert Date objects in debugInfo to ISO strings for persistence
    const segmentsWithSerializedDebug = Object.entries(state.segments).reduce(
      (acc, [id, segment]) => {
        if (segment.metadata?.debugInfo) {
          // Serialize Date objects in debugInfo
          const serializedDebugInfo: SerializedPromptDebugInfo = {
            ...segment.metadata.debugInfo,
            generatedAt: segment.metadata.debugInfo.generatedAt.toISOString(),
            recentDecisions: segment.metadata.debugInfo.recentDecisions?.map((decision) => ({
              ...decision,
              timestamp: decision.timestamp.toISOString(),
            })),
          };
          acc[id] = {
            ...segment,
            metadata: {
              ...segment.metadata,
              debugInfo: serializedDebugInfo as unknown as PromptDebugInfo,
            },
          };
        } else {
          acc[id] = segment;
        }
        return acc;
      },
      {} as Record<EntityID, NarrativeSegment>
    );

    return {
      segments: segmentsWithSerializedDebug,
      sessionSegments: state.sessionSegments,
      decisions: state.decisions,
      sessionDecisions: state.sessionDecisions,
      endedSessions: state.endedSessions,
      currentEnding: state.currentEnding,
    };
  },
  onRehydrateStorage: () => (state) => {
    if (state) {
      // Deserialize Date objects in debugInfo after rehydration
      const deserializedSegments = Object.entries(state.segments).reduce(
        (acc, [id, segment]) => {
          if (segment.metadata?.debugInfo) {
            // Convert ISO strings back to Date objects
            // At this point, debugInfo has been deserialized from JSON, so timestamps are strings
            const serializedDebugInfo = segment.metadata.debugInfo as unknown as SerializedPromptDebugInfo;
            const deserializedDebugInfo: PromptDebugInfo = {
              ...serializedDebugInfo,
              generatedAt: new Date(serializedDebugInfo.generatedAt),
              recentDecisions: serializedDebugInfo.recentDecisions?.map((decision) => ({
                ...decision,
                timestamp: new Date(decision.timestamp),
              })),
            };
            acc[id] = {
              ...segment,
              metadata: {
                ...segment.metadata,
                debugInfo: deserializedDebugInfo,
              },
            };
          } else {
            acc[id] = segment;
          }
          return acc;
        },
        {} as Record<EntityID, NarrativeSegment>
      );

      // Update state with deserialized segments
      state.segments = deserializedSegments;

      // Use proper state setter to trigger subscriptions
      state.setHasHydrated(true);
    }
  },
}
));

// Expose store globally in development for manual testing
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useNarrativeStore = useNarrativeStore;
}
