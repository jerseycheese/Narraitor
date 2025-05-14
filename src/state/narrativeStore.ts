import { create } from 'zustand';
import { NarrativeSegment } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';

/**
 * Narrative store interface with state and actions
 */
interface NarrativeStore {
  // State
  segments: Record<EntityID, NarrativeSegment>;
  sessionSegments: Record<EntityID, EntityID[]>;
  error: string | null;
  loading: boolean;

  // Actions
  addSegment: (sessionId: EntityID, segment: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>) => EntityID;
  updateSegment: (segmentId: EntityID, updates: Partial<NarrativeSegment>) => void;
  deleteSegment: (segmentId: EntityID) => void;
  
  // Query actions
  getSessionSegments: (sessionId: EntityID) => NarrativeSegment[];
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  segments: {},
  sessionSegments: {},
  error: null,
  loading: false,
};

// Narrative Store implementation
export const narrativeStore = create<NarrativeStore>()((set, get) => ({
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
    const updatedSessionSegments = state.sessionSegments[sessionId]?.filter(
      (id) => id !== segmentId
    ) || [];

    return {
      segments: remainingSegments,
      sessionSegments: {
        ...state.sessionSegments,
        [sessionId]: updatedSessionSegments,
      },
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
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
