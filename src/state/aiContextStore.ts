import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { NarrativeGoal, GoalPriority } from '../types/goal.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { useGoalStore } from './goalStore';

// Simplified AI context types
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

// Extended context with goal integration
interface AISessionContext {
  sessionId: EntityID;
  goalContext: string;
  contextText: string;
  activeGoals: NarrativeGoal[];
  criticalGoals: NarrativeGoal[];
  recentGoals: NarrativeGoal[];
  tokenCount: number;
  error: string | null;
  timestamp: string;
}

// Context building options
interface ContextBuildOptions {
  includeGoals?: boolean;
  maxChars?: number;
  prioritizeRecent?: boolean;
}

/**
 * AI Context store interface with state and actions
 */
interface AIContextStore {
  // State
  contexts: Record<EntityID, AIContext>;
  contextHistory: Record<EntityID, AISessionContext[]>;
  activeContextId: EntityID | null;
  error: string | null;
  loading: boolean;

  // Original Actions
  createContext: (sessionId: EntityID) => EntityID;
  updateContext: (contextId: EntityID, updates: Partial<AIContext>) => void;
  addPromptContext: (contextId: EntityID, promptContext: AIPromptContext) => void;
  clearContext: (contextId: EntityID) => void;

  // Goal Integration Actions
  buildContextForSession: (sessionId: EntityID, options?: ContextBuildOptions) => AISessionContext;
  saveContextToHistory: (sessionId: EntityID, context: AISessionContext) => void;
  getContextHistory: (sessionId: EntityID) => AISessionContext[];

  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Simplified helpers
const formatGoalForContext = (goal: NarrativeGoal): string => {
  const mainText = goal.contextSummary || goal.title;
  const priorityPrefix = goal.priority === 'critical' ? 'URGENT: ' : '';
  let context = `${priorityPrefix}${mainText}`;

  if (goal.progressNotes && goal.progressNotes.length > 0) {
    context += ` Progress: ${goal.progressNotes.join(', ')}`;
  }

  return context;
};

const priorityOrder: Record<GoalPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const sortGoalsByPriority = (goals: NarrativeGoal[]): NarrativeGoal[] => {
  return [...goals].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

// Initial state
const initialState = {
  contexts: {},
  contextHistory: {},
  activeContextId: null,
  error: null,
  loading: false,
};

// AI Context Store implementation
export const aiContextStore = create<AIContextStore>()((set, get) => ({
  ...initialState,

  createContext: (sessionId) => {
    const contextId = generateUniqueId('context');

    const newContext: AIContext = {
      id: contextId,
      sessionId,
      recentContext: [],
      constraints: [],
      metadata: {
        tokenCount: 0,
        lastUpdated: getTimestamp(),
      },
    };

    set((state) => ({
      contexts: {
        ...state.contexts,
        [contextId]: newContext,
      },
      activeContextId: contextId,
    }));

    return contextId;
  },

  updateContext: (contextId, updates) =>
    set((state) => {
      if (!state.contexts[contextId]) {
        return { error: 'Context not found' };
      }

      const updatedContext: AIContext = {
        ...state.contexts[contextId],
        ...updates,
        metadata: {
          ...state.contexts[contextId].metadata,
          lastUpdated: getTimestamp(),
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

  addPromptContext: (contextId, promptContext) =>
    set((state) => {
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
          lastUpdated: getTimestamp(),
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

  clearContext: (contextId) =>
    set((state) => {
      if (!state.contexts[contextId]) {
        return { error: 'Context not found' };
      }

      const clearedContext: AIContext = {
        ...state.contexts[contextId],
        recentContext: [],
        metadata: {
          tokenCount: 0,
          lastUpdated: getTimestamp(),
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

  // Simplified goal context building
  buildContextForSession: (sessionId, options = {}) => {
    try {
      const goalStore = useGoalStore.getState();
      const activeGoals = goalStore.getActiveGoalsBySession(sessionId);

      // Include goals by default unless explicitly disabled
      const shouldIncludeGoals = options.includeGoals !== false;
      const maxChars = options.maxChars || 5000; // Simple character limit instead of token estimation

      if (!shouldIncludeGoals || activeGoals.length === 0) {
        return {
          sessionId,
          goalContext: '',
          contextText: '',
          activeGoals: [],
          criticalGoals: [],
          recentGoals: [],
          tokenCount: 0,
          error: null,
          timestamp: getTimestamp(),
        };
      }

      // Simple priority sorting
      const prioritizedGoals = sortGoalsByPriority(activeGoals);

      // Separate critical goals
      const criticalGoals = prioritizedGoals.filter((goal) => goal.priority === 'critical');

      // Get recent goals if requested
      const recentGoals = options.prioritizeRecent
        ? goalStore.getRecentlyMentionedGoals(30 * 60 * 1000).filter((goal) => goal.sessionId === sessionId)
        : [];

      // Build context with simple character limiting
      let goalContext = 'ACTIVE GOALS:\n';
      const includedGoals: NarrativeGoal[] = [];

      for (const goal of prioritizedGoals) {
        const goalLine = formatGoalForContext(goal) + '\n';

        if (goalContext.length + goalLine.length <= maxChars) {
          goalContext += goalLine;
          includedGoals.push(goal);
        } else {
          break; // Stop when we hit the character limit
        }
      }

      const finalGoalContext = goalContext.trim();
      return {
        sessionId,
        goalContext: finalGoalContext,
        contextText: finalGoalContext,
        activeGoals: includedGoals,
        criticalGoals,
        recentGoals,
        tokenCount: finalGoalContext.length, // Approximate with character count
        error: null,
        timestamp: getTimestamp(),
      };
    } catch (error) {
      return {
        sessionId,
        goalContext: '',
        contextText: '',
        activeGoals: [],
        criticalGoals: [],
        recentGoals: [],
        tokenCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error building context',
        timestamp: getTimestamp(),
      };
    }
  },

  saveContextToHistory: (sessionId, context) => {
    set((state) => {
      const sessionHistory = state.contextHistory[sessionId] || [];
      const maxHistorySize = 10;

      const updatedHistory = [...sessionHistory, context];

      // Trim history if too long
      if (updatedHistory.length > maxHistorySize) {
        updatedHistory.splice(0, updatedHistory.length - maxHistorySize);
      }

      return {
        contextHistory: {
          ...state.contextHistory,
          [sessionId]: updatedHistory,
        },
      };
    });
  },

  getContextHistory: (sessionId) => {
    const state = get();
    return state.contextHistory[sessionId] || [];
  },

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));

// Export as useAiContextStore for compatibility
export const useAiContextStore = aiContextStore;
