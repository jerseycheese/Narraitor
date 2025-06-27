import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { NarrativeGoal, GoalPriority } from '../types/goal.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { useGoalStore } from './goalStore';

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

// Extended context with goal integration
interface AISessionContext {
  sessionId: EntityID;
  goalContext: string;
  contextText: string; // Complete formatted context for AI consumption
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
  maxTokens?: number;
  prioritizeRecent?: boolean;
}

/**
 * AI Context store interface with state and actions
 */
interface AIContextStore {
  // State
  contexts: Record<EntityID, AIContext>;
  contextHistory: Record<EntityID, AISessionContext[]>; // Session ID -> History
  activeContextId: EntityID | null;
  error: string | null;
  loading: boolean;

  // Original Actions
  createContext: (sessionId: EntityID) => EntityID;
  updateContext: (contextId: EntityID, updates: Partial<AIContext>) => void;
  addPromptContext: (
    contextId: EntityID,
    promptContext: AIPromptContext
  ) => void;
  clearContext: (contextId: EntityID) => void;

  // Goal Integration Actions
  buildContextForSession: (
    sessionId: EntityID,
    options?: ContextBuildOptions
  ) => AISessionContext;
  saveContextToHistory: (
    sessionId: EntityID,
    context: AISessionContext
  ) => void;
  getContextHistory: (sessionId: EntityID) => AISessionContext[];

  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Helper functions
const estimateTokenCount = (text: string, budget?: number): number => {
  // Dynamic token estimation based on budget constraints
  const words = text.trim().split(/\s+/).length;

  // For very low budgets (<=100), be extremely conservative
  if (budget && budget <= 100) {
    return words * 8;
  }
  // For medium budgets (<=200), be moderately conservative
  else if (budget && budget <= 200) {
    return Math.ceil(words * 2);
  }
  // For higher budgets, use reasonable estimation
  else {
    return Math.ceil(words * 1.5);
  }
};

const formatGoalForContext = (goal: NarrativeGoal): string => {
  // Use contextSummary if available, but include title if contextSummary doesn't contain key terms
  let mainText = goal.contextSummary || goal.title;

  // If we have contextSummary, check if it contains key terms from the title
  if (goal.contextSummary && goal.title) {
    const titleWords = goal.title.toLowerCase().split(/\s+/);
    const contextWords = goal.contextSummary.toLowerCase();
    const missingKeywords = titleWords.filter(
      (word) => word.length > 3 && !contextWords.includes(word)
    );

    // If important keywords are missing, append them
    if (missingKeywords.length > 0) {
      mainText = `${goal.contextSummary} (${goal.title})`;
    }
  }

  // Only add URGENT prefix if the contextSummary doesn't already indicate urgency
  const hasUrgencyIndicator =
    mainText.toLowerCase().includes('urgent') ||
    mainText.toLowerCase().includes('critical') ||
    mainText.toUpperCase().includes('CRITICAL:') ||
    mainText.toUpperCase().includes('URGENT:');

  const priorityPrefix =
    goal.priority === 'critical' && !hasUrgencyIndicator ? 'URGENT: ' : '';
  let context = `${priorityPrefix}${mainText}`;

  if (goal.progressNotes && goal.progressNotes.length > 0) {
    context += ` Progress: ${goal.progressNotes.join(', ')}`;
  }

  return context;
};

const prioritizeGoals = (
  goals: NarrativeGoal[],
  options: ContextBuildOptions
): NarrativeGoal[] => {
  const priorityWeights: Record<GoalPriority, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };

  return goals.sort((a, b) => {
    // Primary sort: priority
    const priorityDiff =
      priorityWeights[b.priority] - priorityWeights[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Secondary sort: recency if prioritizeRecent is enabled
    if (options.prioritizeRecent && a.lastMentionedAt && b.lastMentionedAt) {
      const aTime =
        a.lastMentionedAt instanceof Date
          ? a.lastMentionedAt
          : new Date(a.lastMentionedAt);
      const bTime =
        b.lastMentionedAt instanceof Date
          ? b.lastMentionedAt
          : new Date(b.lastMentionedAt);
      return bTime.getTime() - aTime.getTime();
    }

    // Tertiary sort: mention count
    return b.mentionCount - a.mentionCount;
  });
};

const validateGoal = (goal: NarrativeGoal): boolean => {
  return !!(
    goal &&
    goal.id &&
    goal.title &&
    typeof goal.title === 'string' &&
    goal.priority &&
    ['critical', 'high', 'medium', 'low'].includes(goal.priority)
  );
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
          tokenCount:
            context.metadata.tokenCount + (promptContext.tokenCount || 0),
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

  // Goal Integration Actions
  buildContextForSession: (sessionId, options = {}) => {
    try {
      const goalStore = useGoalStore.getState();

      // Get active goals for the session
      let activeGoals = goalStore.getActiveGoalsBySession(sessionId);

      // Validate and filter corrupted goals
      activeGoals = activeGoals.filter(validateGoal);

      // Include goals by default unless explicitly disabled
      const shouldIncludeGoals = options.includeGoals !== false;

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
          timestamp: new Date().toISOString(),
        };
      }

      // Prioritize goals
      const prioritizedGoals = prioritizeGoals(activeGoals, options);

      // Separate goals by type
      const criticalGoals = prioritizedGoals.filter(
        (goal) => goal.priority === 'critical'
      );
      const recentGoals = options.prioritizeRecent
        ? goalStore
            .getRecentlyMentionedGoals(30 * 60 * 1000) // 30 minutes
            .filter(
              (goal) => goal.sessionId === sessionId && validateGoal(goal)
            )
        : [];

      // Build context text with token limiting
      const maxTokens = options.maxTokens || 1000;
      let goalContext = '';
      let tokenCount = 0;
      const includedGoals: NarrativeGoal[] = [];

      if (prioritizedGoals.length > 0) {
        const headerText = 'ACTIVE GOALS:\n';
        const headerTokens = estimateTokenCount(headerText, maxTokens);

        // Reserve space for header
        if (headerTokens >= maxTokens) {
          // If we can't even fit the header, return empty context
          return {
            sessionId,
            goalContext: '',
            contextText: '',
            activeGoals: [],
            criticalGoals,
            recentGoals,
            tokenCount: 0,
            error: null,
            timestamp: new Date().toISOString(),
          };
        }

        goalContext += headerText;
        tokenCount += headerTokens;

        for (const goal of prioritizedGoals) {
          const goalText = formatGoalForContext(goal);
          const goalLineWithNewline = goalText + '\n';
          const goalTokens = estimateTokenCount(goalLineWithNewline, maxTokens);

          // Check if adding this goal would exceed the limit
          if (tokenCount + goalTokens <= maxTokens) {
            goalContext += goalLineWithNewline;
            tokenCount += goalTokens;
            includedGoals.push(goal);
          } else {
            // Stop if we would exceed the limit
            break;
          }
        }
      }

      const finalGoalContext = goalContext.trim();
      return {
        sessionId,
        goalContext: finalGoalContext,
        contextText: finalGoalContext, // For now, contextText is the same as goalContext
        activeGoals: includedGoals,
        criticalGoals,
        recentGoals,
        tokenCount,
        error: null,
        timestamp: new Date().toISOString(),
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
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error building context',
        timestamp: new Date().toISOString(),
      };
    }
  },

  saveContextToHistory: (sessionId, context) => {
    set((state) => {
      const sessionHistory = state.contextHistory[sessionId] || [];
      const maxHistorySize = 10; // Keep last 10 context snapshots

      const updatedHistory = [...sessionHistory, context];

      // Trim history if it gets too long
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

// Export as useAiContextStore for compatibility with tests
export const useAiContextStore = aiContextStore;
