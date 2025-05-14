import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';

// Simplified AI context types for MVP implementation
interface AIPromptContext {
  type: string;
  content: string;
  tokenCount?: number;
}

interface AIConstraint {
  type: string;
  value: string | number;
}

interface AIContext {
  id: EntityID;
  sessionId: EntityID;
  recentContext: AIPromptContext[];
  constraints: AIConstraint[];
  metadata: {
    tokenCount: number;
    lastUpdated: string;
  };
}

/**
 * AI Context store interface with state and actions
 */
interface AIContextStore {
  // State
  contexts: Record<EntityID, AIContext>;
  activeContextId: EntityID | null;
  error: string | null;
  loading: boolean;

  // Actions
  createContext: (sessionId: EntityID) => EntityID;
  updateContext: (contextId: EntityID, updates: Partial<AIContext>) => void;
  addPromptContext: (contextId: EntityID, promptContext: AIPromptContext) => void;
  clearContext: (contextId: EntityID) => void;
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  contexts: {},
  activeContextId: null,
  error: null,
  loading: false,
};

// AI Context Store implementation
export const aiContextStore = create<AIContextStore>()((set) => ({
  ...initialState,

  // Create context
  createContext: (sessionId) => {
    const contextId = generateUniqueId('context');
    
    const newContext: AIContext = {
      id: contextId,
      sessionId,
      recentContext: [],
      constraints: [],
      metadata: {
        tokenCount: 0,
        lastUpdated: new Date().toISOString(),
      },
    };

    set((state) => ({
      contexts: {
        ...state.contexts,
        [contextId]: newContext,
      },
      activeContextId: contextId, // New contexts become active by default
    }));

    return contextId;
  },

  // Update context
  updateContext: (contextId, updates) => set((state) => {
    if (!state.contexts[contextId]) {
      return { error: 'Context not found' };
    }

    const updatedContext: AIContext = {
      ...state.contexts[contextId],
      ...updates,
      metadata: {
        ...state.contexts[contextId].metadata,
        lastUpdated: new Date().toISOString(),
      },
    };

    return {
      contexts: {
        ...state.contexts,
        [contextId]: updatedContext,
      },
      error: null,
    };
  }),

  // Add prompt context
  addPromptContext: (contextId, promptContext) => set((state) => {
    if (!state.contexts[contextId]) {
      return { error: 'Context not found' };
    }

    const context = state.contexts[contextId];
    const updatedContext: AIContext = {
      ...context,
      recentContext: [...context.recentContext, promptContext],
      metadata: {
        ...context.metadata,
        tokenCount: context.metadata.tokenCount + (promptContext.tokenCount || 0),
        lastUpdated: new Date().toISOString(),
      },
    };

    return {
      contexts: {
        ...state.contexts,
        [contextId]: updatedContext,
      },
      error: null,
    };
  }),

  // Clear context
  clearContext: (contextId) => set((state) => {
    if (!state.contexts[contextId]) {
      return { error: 'Context not found' };
    }

    const clearedContext: AIContext = {
      ...state.contexts[contextId],
      recentContext: [],
      metadata: {
        tokenCount: 0,
        lastUpdated: new Date().toISOString(),
      },
    };

    return {
      contexts: {
        ...state.contexts,
        [contextId]: clearedContext,
      },
      error: null,
    };
  }),

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
