import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { NarrativeGoal, GoalPriority } from '../types/goal.types';
import { getTimestamp } from '@/lib/utils';

// Module cache for dynamic import to break circular dependencies
let goalStoreModule: typeof import('./goalStore') | null = null;

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
  error: string | null;
  loading: boolean;

  // Goal Integration Actions
  buildContextForSession: (sessionId: EntityID, options?: ContextBuildOptions) => Promise<AISessionContext>;

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
  error: null,
  loading: false,
};

// AI Context Store implementation
export const useAiContextStore = create<AIContextStore>()((set) => ({
  ...initialState,

  // Simplified goal context building
  buildContextForSession: async (sessionId, options = {}) => {
    try {
      let goalStore;
      try {
        if (!goalStoreModule) {
          goalStoreModule = await import('./goalStore');
        }
        const { useGoalStore } = goalStoreModule;
        goalStore = useGoalStore.getState();
      } catch (error) {
        return {
          sessionId,
          goalContext: '',
          contextText: '',
          activeGoals: [],
          criticalGoals: [],
          recentGoals: [],
          tokenCount: 0,
          error: error instanceof Error ? error.message : 'Failed to load goalStore',
          timestamp: getTimestamp(),
        };
      }
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

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
