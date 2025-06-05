import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Decision, NarrativeSegment, StoryEnding, EndingType, EndingTone } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { endingGenerator } from '../lib/ai/endingGenerator';

/**
 * Narrative store interface with state and actions
 */
interface NarrativeStore {
  // State
  segments: Record<EntityID, NarrativeSegment>;
  sessionSegments: Record<EntityID, EntityID[]>;
  decisions: Record<EntityID, Decision>;
  sessionDecisions: Record<EntityID, EntityID[]>;
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
  selectDecisionOption: (decisionId: EntityID, optionId: EntityID) => void;
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
  saveEndingToHistory: () => void;
  hasActiveEnding: () => boolean;
  getEndingForSession: (sessionId: EntityID) => StoryEnding | null;
}

// Initial state
const initialState = {
  segments: {},
  sessionSegments: {},
  decisions: {},
  sessionDecisions: {},
  currentEnding: null,
  isGeneratingEnding: false,
  endingError: null,
  error: null,
  loading: false,
};

// Narrative Store implementation with persistence
export const useNarrativeStore = create<NarrativeStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Add segment
  addSegment: (sessionId, segmentData) => {
    if (!segmentData.content || segmentData.content.trim() === '') {
      throw new Error('Segment content is required');
    }

    const segmentId = generateUniqueId('segment');
    const now = new Date().toISOString();
    
    const newSegment: NarrativeSegment = {
      ...segmentData,
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
  
  selectDecisionOption: (decisionId, optionId) => set((state) => {
    if (!state.decisions[decisionId]) {
      return { error: 'Decision not found' };
    }

    const updatedDecision: Decision = {
      ...state.decisions[decisionId],
      selectedOptionId: optionId,
    };

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
    } catch (error) {
      set({ 
        isGeneratingEnding: false, 
        endingError: (error as Error).message || 'Failed to generate ending'
      });
    }
  },
  
  clearEnding: () => set({ currentEnding: null, endingError: null }),
  
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
      seg.metadata.tags?.includes('ending') && 
      seg.metadata.endingData
    );
    
    return endingSegment?.metadata.endingData as StoryEnding || null;
  },
}),
{
  name: 'narraitor-narrative-store',
  storage: createIndexedDBStorage(),
  version: 1,
}
));
