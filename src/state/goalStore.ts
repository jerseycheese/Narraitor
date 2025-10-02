/**
 * Goal Store
 *
 * Manages narrative goals with session tracking, status transitions, and mention counting.
 * Provides functionality for creating, updating, deleting, and querying goals with persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import {
  NarrativeGoal,
  GoalPriority,
  GoalExtractionRequest,
} from '../types/goal.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { goalExtractor } from '../lib/ai/goalExtractor';

/**
 * Result from processing a narrative segment for goal extraction
 */
interface ProcessSegmentResult {
  newGoalsCreated: number;
  goalsUpdated: number;
  goalsCompleted: number;
  error?: string;
}

/**
 * Goal store interface with state and actions
 */
interface GoalStore {
  // State
  goals: Record<EntityID, NarrativeGoal>;
  sessionGoals: Record<EntityID, EntityID[]>; // Maps session ID to goal IDs
  activeGoalIds: EntityID[]; // IDs of all active goals across sessions
  error: string | null;
  loading: boolean;

  // Core CRUD Actions
  createGoal: (
    goalData: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => EntityID;
  updateGoal: (goalId: EntityID, updates: Partial<NarrativeGoal>) => void;
  deleteGoal: (goalId: EntityID) => void;

  // Query Actions
  getActiveGoalsBySession: (sessionId: EntityID) => NarrativeGoal[];
  getGoalsByPriority: (priority: GoalPriority) => NarrativeGoal[];
  getRecentlyMentionedGoals: (withinMs: number) => NarrativeGoal[];

  // Goal Management Actions
  incrementMentionCount: (goalId: EntityID) => void;
  addProgressNote: (goalId: EntityID, note: string) => void;
  clearSessionGoals: (sessionId: EntityID) => void;

  // Integration Actions
  processSegmentForGoals: (
    segmentId: EntityID,
    characterId?: EntityID
  ) => Promise<ProcessSegmentResult>;

  // State Management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  goals: {},
  sessionGoals: {},
  activeGoalIds: [],
  error: null,
  loading: false,
};

// Validation function for goal data
const validateGoalData = (data: Partial<NarrativeGoal>): void => {
  const normalizedTitle = normalizeText(data.title || '', NORM_NAME);
  if (!normalizedTitle) {
    throw new Error('Goal title is required');
  }
  if (!data.sessionId) {
    throw new Error('Session ID is required');
  }
  const normalizedDescription = normalizeText(data.description || '', NORM_DESC);
  if (!normalizedDescription) {
    throw new Error('Goal description is required');
  }
};

// Helper function to update active goal IDs
const updateActiveGoalIds = (
  goals: Record<EntityID, NarrativeGoal>
): EntityID[] => {
  return Object.values(goals)
    .filter((goal) => goal.status === 'active')
    .map((goal) => goal.id);
};

// Goal Store implementation with persistence
export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Create goal
      createGoal: (goalData) => {
        validateGoalData(goalData);

        const goalId = generateUniqueId('goal');
        const now = getTimestamp();

        const newGoal: NarrativeGoal = {
          ...goalData,
          title: normalizeText(goalData.title, NORM_NAME),
          description: normalizeText(goalData.description, NORM_DESC),
          id: goalId,
          createdAt: now,
          updatedAt: now,
          mentionCount: goalData.mentionCount || 0,
        };

        set((state) => {
          // Initialize session goals if not exists
          const sessionGoals = state.sessionGoals[goalData.sessionId] || [];

          const updatedGoals = {
            ...state.goals,
            [goalId]: newGoal,
          };

          return {
            goals: updatedGoals,
            sessionGoals: {
              ...state.sessionGoals,
              [goalData.sessionId]: [...sessionGoals, goalId],
            },
            activeGoalIds: updateActiveGoalIds(updatedGoals),
            error: null,
          };
        });

        return goalId;
      },

      // Update goal
      updateGoal: (goalId, updates) => {
        const state = get();
        const existingGoal = state.goals[goalId];

        if (!existingGoal) {
          throw new Error('Goal not found');
        }

        const now = getTimestamp();
        const updatedGoal = {
          ...existingGoal,
          ...updates,
          updatedAt: now,
        };

        // Handle status transitions
        if (updates.status && updates.status !== existingGoal.status) {
          if (
            updates.status === 'completed' ||
            updates.status === 'abandoned'
          ) {
            updatedGoal.completedAt = new Date();
          }
        }

        set((state) => {
          const updatedGoals = {
            ...state.goals,
            [goalId]: updatedGoal,
          };

          return {
            goals: updatedGoals,
            activeGoalIds: updateActiveGoalIds(updatedGoals),
            error: null,
          };
        });
      },

      // Delete goal
      deleteGoal: (goalId) => {
        const state = get();
        const goal = state.goals[goalId];

        if (!goal) {
          return; // Silent fail for delete
        }

        set((state) => {
          // Remove from goals
          const remainingGoals = { ...state.goals };
          delete remainingGoals[goalId];

          // Remove from session goals
          const sessionId = goal.sessionId;
          const updatedSessionGoals =
            state.sessionGoals[sessionId]?.filter((id) => id !== goalId) || [];

          return {
            goals: remainingGoals,
            sessionGoals: {
              ...state.sessionGoals,
              [sessionId]: updatedSessionGoals,
            },
            activeGoalIds: updateActiveGoalIds(remainingGoals),
            error: null,
          };
        });
      },

      // Get active goals by session
      getActiveGoalsBySession: (sessionId) => {
        const state = get();
        const goalIds = state.sessionGoals[sessionId] || [];
        return goalIds
          .map((id) => state.goals[id])
          .filter((goal) => goal && goal.status === 'active');
      },

      // Get goals by priority
      getGoalsByPriority: (priority) => {
        const state = get();
        return Object.values(state.goals).filter(
          (goal) => goal.priority === priority
        );
      },

      // Get recently mentioned goals
      getRecentlyMentionedGoals: (withinMs) => {
        const state = get();
        const cutoffTime = new Date(Date.now() - withinMs);

        return Object.values(state.goals).filter((goal) => {
          if (!goal.lastMentionedAt) return false;
          const mentionTime =
            goal.lastMentionedAt instanceof Date
              ? goal.lastMentionedAt
              : new Date(goal.lastMentionedAt);
          return mentionTime >= cutoffTime;
        });
      },

      // Increment mention count
      incrementMentionCount: (goalId) => {
        const state = get();
        const goal = state.goals[goalId];

        if (!goal) {
          throw new Error('Goal not found');
        }

        const now = new Date();
        const updatedGoal = {
          ...goal,
          mentionCount: goal.mentionCount + 1,
          lastMentionedAt: now,
          updatedAt: now.toISOString(),
        };

        set((state) => ({
          goals: {
            ...state.goals,
            [goalId]: updatedGoal,
          },
          error: null,
        }));
      },

      // Add progress note
      addProgressNote: (goalId, note) => {
        const state = get();
        const goal = state.goals[goalId];

        if (!goal) {
          throw new Error('Goal not found');
        }

        const updatedGoal = {
          ...goal,
          progressNotes: [...(goal.progressNotes || []), note],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          goals: {
            ...state.goals,
            [goalId]: updatedGoal,
          },
          error: null,
        }));
      },

      // Clear session goals
      clearSessionGoals: (sessionId) => {
        const state = get();
        const goalIdsToRemove = state.sessionGoals[sessionId] || [];

        if (goalIdsToRemove.length === 0) return;

        set((state) => {
          // Remove goals from the goals record
          const updatedGoals = { ...state.goals };
          goalIdsToRemove.forEach((id) => {
            delete updatedGoals[id];
          });

          // Remove session from sessionGoals
          const remainingSessionGoals = { ...state.sessionGoals };
          delete remainingSessionGoals[sessionId];

          return {
            goals: updatedGoals,
            sessionGoals: remainingSessionGoals,
            activeGoalIds: updateActiveGoalIds(updatedGoals),
            error: null,
          };
        });
      },

      // Process narrative segment for goal extraction and updates
      processSegmentForGoals: async (segmentId, characterId) => {
        try {
          // Get narrative segment from narrativeStore
          const { useNarrativeStore } = await import('./narrativeStore');
          const narrativeState = useNarrativeStore.getState();
          const segment = narrativeState.segments[segmentId];

          if (!segment) {
            return {
              newGoalsCreated: 0,
              goalsUpdated: 0,
              goalsCompleted: 0,
              error: 'Narrative segment not found',
            };
          }

          const goalState = get();
          const sessionId = Object.keys(narrativeState.sessionSegments).find(
            (sessionId) =>
              narrativeState.sessionSegments[sessionId]?.includes(segmentId)
          );

          if (!sessionId) {
            return {
              newGoalsCreated: 0,
              goalsUpdated: 0,
              goalsCompleted: 0,
              error: 'Session ID not found for segment',
            };
          }

          // Get existing goals for context
          const existingGoals =
            goalState.sessionGoals[sessionId]
              ?.map((id) => goalState.goals[id])
              .filter(Boolean) || [];

          // Prepare extraction request
          const extractionRequest: GoalExtractionRequest = {
            content: segment.content,
            sessionId,
            segmentId,
            characterId,
            worldId: segment.worldId,
            existingGoals,
          };

          // Extract goals using AI
          const extractionResult =
            await goalExtractor.extractGoalsFromNarrative(extractionRequest);

          let newGoalsCreated = 0;
          let goalsUpdated = 0;
          let goalsCompleted = 0;

          // Create new goals
          for (const newGoalData of extractionResult.newGoals) {
            try {
              validateGoalData(newGoalData);
              const goalId = get().createGoal(newGoalData);
              if (goalId) {
                newGoalsCreated++;
              }
            } catch {
              // Continue processing other goals
            }
          }

          // Update existing goals
          for (const goalUpdate of extractionResult.updatedGoals) {
            try {
              const existingGoal = goalState.goals[goalUpdate.goalId];
              if (existingGoal) {
                get().updateGoal(goalUpdate.goalId, goalUpdate.updates);
                goalsUpdated++;
              }
            } catch {
              // Continue processing other goals
            }
          }

          // Handle completed goals
          goalsCompleted = extractionResult.completedGoals.length;

          return {
            newGoalsCreated,
            goalsUpdated,
            goalsCompleted,
          };
        } catch {
          return {
            newGoalsCreated: 0,
            goalsUpdated: 0,
            goalsCompleted: 0,
            error: 'Failed to process segment for goals',
          };
        }
      },

      // State management actions
      reset: () => set(() => initialState),
      setError: (error) => set(() => ({ error })),
      clearError: () => set(() => ({ error: null })),
      setLoading: (loading) => set(() => ({ loading })),
    }),
    {
      name: 'narraitor-goal-store',
      storage: createIndexedDBStorage(),
      version: 1,
      partialize: (state) => ({
        goals: state.goals,
        sessionGoals: state.sessionGoals,
        activeGoalIds: state.activeGoalIds,
      }),
    }
  )
);
