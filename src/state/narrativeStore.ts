import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Decision, NarrativeSegment, StoryEnding, EndingType, EndingTone, ChoiceAlignment } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { ChoiceTypePreference } from '../types/personalization.types';
import { generateUniqueId } from '../lib/utils';
import { createIndexedDBStorage } from './persistence';
import { endingGenerator } from '../lib/ai/endingGenerator';
import { logger } from '../lib/utils/logger';
import { normalizeText } from '../lib/utils/textNormalization';
import { playerDecisionTracker } from '../lib/ai/playerDecisionTracker';


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
  
  // Ending actions
  generateEnding: (endingType: EndingType, params: {
    sessionId: EntityID;
    characterId: EntityID;
    worldId: EntityID;
    desiredTone?: EndingTone;
    customPrompt?: string;
  }) => Promise<void>;
  clearEnding: () => void;
  setCurrentEnding: (ending: StoryEnding | null) => void;
  saveEndingToHistory: () => void;
  hasActiveEnding: () => boolean;
  getEndingForSession: (sessionId: EntityID) => StoryEnding | null;
  isSessionEnded: (sessionId: EntityID) => boolean;
  markSessionEnded: (sessionId: EntityID) => void;
}

// Initial state
const initialState = {
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
};

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
    const normalizedContent = normalizeText(segmentData.content || '', {
      normalizeWhitespace: true,
      normalizeLineEndings: true,
      normalizeQuotes: true,
      normalizeSpecialChars: true,
      preserveStructure: true
    });
    if (!normalizedContent) {
      throw new Error('Segment content is required');
    }
    
    // Prevent adding segments to ended sessions
    if (get().isSessionEnded(sessionId)) {
      throw new Error('Cannot add segments to an ended session');
    }

    const segmentId = generateUniqueId('segment');
    const now = new Date().toISOString();
    
    const newSegment: NarrativeSegment = {
      ...segmentData,
      content: normalizeText(segmentData.content, {
        normalizeWhitespace: true,
        normalizeLineEndings: true,
        normalizeQuotes: true,
        normalizeSpecialChars: true,
        preserveStructure: true
      }),
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

    // Process the segment for goal extraction asynchronously
    // Import goalStore dynamically to avoid circular dependencies
    import('../state/goalStore').then(({ useGoalStore }) => {
      const goalStore = useGoalStore.getState();
      goalStore.processSegmentForGoals(segmentId, segmentData.metadata?.characterIds?.[0])
        .then((result) => {
          logger.debug('[NarrativeStore]', 'Goal processing result:', result);
        })
        .catch((error) => {
          logger.error('[NarrativeStore]', 'Goal processing failed:', error);
        });
    }).catch((error) => {
      logger.error('[NarrativeStore]', 'Failed to import goalStore:', error);
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
  
  selectDecisionOption: (decisionId, optionId, characterId) => set((state) => {
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

    // Track decision in PlayerDecisionTracker for narrative personalization
    try {
      // Find session and world IDs
      let sessionId: EntityID | null = null;
      let worldId: EntityID | null = null;

      // Find which session contains this decision
      for (const [sId, decisionIds] of Object.entries(state.sessionDecisions)) {
        if (decisionIds.includes(decisionId)) {
          sessionId = sId;
          break;
        }
      }

      // Find worldId from narrative segments in the same session
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
        // Determine choice type from alignment or text analysis
        let choiceType: ChoiceTypePreference = 'neutral';
        if (selectedOption.alignment) {
          choiceType = mapAlignmentToChoiceType(selectedOption.alignment);
        } else {
          choiceType = inferChoiceTypeFromText();
        }

        // Extract context from decision and recent segments
        const sessionSegmentIds = state.sessionSegments[sessionId] || [];
        const sessionSegments = sessionSegmentIds.map(id => state.segments[id]).filter(Boolean);
        const context = extractDecisionContext(decision.prompt, sessionSegments);

        // Record decision in PlayerDecisionTracker
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
      // Log error but don't break the game flow
      logger.warn('Failed to track player decision:', error);
    }

    return {
      decisions: {
        ...state.decisions,
        [decisionId]: updatedDecision,
      },
      error: null,
    };
  }),
  
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
      const result = await endingGenerator.generateEnding({
        sessionId: params.sessionId,
        characterId: params.characterId,
        worldId: params.worldId,
        endingType,
        desiredTone: params.desiredTone,
        customPrompt: params.customPrompt
      });
      
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
        achievements: result.achievements,
        playTime: result.playTime
      };
      
      set({ 
        currentEnding: ending, 
        isGeneratingEnding: false,
        endingError: null
      });
      
      // Mark the session as ended to prevent further generation
      get().markSessionEnded(params.sessionId);
    } catch (error) {
      logger.error('Failed to generate ending', { error, endingType, params });
      
      // Show the actual error instead of fallback for debugging
      set({ 
        currentEnding: null,
        isGeneratingEnding: false, 
        endingError: `AI ending generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check your GEMINI_API_KEY configuration.`
      });
    }
  },
  
  clearEnding: () => set({ currentEnding: null, endingError: null }),
  
  setCurrentEnding: (ending) => set({ currentEnding: ending, endingError: null }),
  
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
  },
}),
{
  name: 'narraitor-narrative-store',
  storage: createIndexedDBStorage(),
  version: 1,
}
));
