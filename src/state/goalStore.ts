import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import {
  NarrativeGoal,
  GoalPriority,
  GoalExtractionRequest,
  GoalExtractionResult,
} from '../types/goal.types';
import type { NarrativeSegment } from '../types/narrative.types';
import type { WorldThreadExtractionInput, WorldThreadExtractionResult } from '../types/worldThread.types';
import type { WorldCostExtractionInput, WorldCostExtractionResult } from '../types/worldCost.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { storeEvents, StoreEventTypes, type WorldDeletedEvent } from '@/lib/state/storePubSub';
import { extractGoalsFromNarrative } from '../lib/ai/goalExtractor';
import { CrudStore } from './crudStore.types';

interface ProcessSegmentResult {
  newGoalsCreated: number;
  goalsUpdated: number;
  goalsCompleted: number;
  /** The world clock's ledger changes, when the caller passed ledger context in. */
  worldThreads?: WorldThreadExtractionResult;
  worldCost?: WorldCostExtractionResult;
  error?: UserFriendlyError;
}

export interface GoalStore extends CrudStore<NarrativeGoal> {
  goals: Record<EntityID, NarrativeGoal>;
  sessionGoals: Record<EntityID, EntityID[]>;
  activeGoalIds: EntityID[];
  error: UserFriendlyError | null;
  loading: boolean;

  createGoal: (goalData: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateGoal: (goalId: EntityID, updates: Partial<NarrativeGoal>) => void;
  deleteGoal: (goalId: EntityID) => void;

  getActiveGoalsBySession: (sessionId: EntityID) => NarrativeGoal[];
  getGoalsByPriority: (priority: GoalPriority) => NarrativeGoal[];
  getRecentlyMentionedGoals: (withinMs: number) => NarrativeGoal[];

  incrementMentionCount: (goalId: EntityID) => void;
  addProgressNote: (goalId: EntityID, note: string) => void;
  clearSessionGoals: (sessionId: EntityID) => void;
  clearWorldGoals: (worldId: EntityID) => void;
  processSegmentForGoals: (
    segment: NarrativeSegment,
    sessionId: EntityID,
    characterId?: EntityID,
    worldThreads?: WorldThreadExtractionInput,
    worldCost?: WorldCostExtractionInput
  ) => Promise<ProcessSegmentResult>;
}

const getInitialState = () => ({
  goals: {} as Record<EntityID, NarrativeGoal>,
  entities: {} as Record<EntityID, NarrativeGoal>,
  sessionGoals: {} as Record<EntityID, EntityID[]>,
  activeGoalIds: [] as EntityID[],
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

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

const updateActiveGoalIds = (goals: Record<EntityID, NarrativeGoal>): EntityID[] =>
  Object.values(goals)
    .filter((goal) => goal.status === 'active')
    .map((goal) => goal.id);

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      create: (goalData) => {
        validateGoalData(goalData);

        const goalId = generateUniqueId('goal');
        const now = getTimestamp();

        const normalizedTitle = normalizeText(goalData.title, NORM_NAME);
        const normalizedDescription = normalizeText(goalData.description, NORM_DESC);

        const newGoal: NarrativeGoal = {
          ...goalData,
          id: goalId,
          title: normalizedTitle,
          description: normalizedDescription,
          mentionCount: goalData.mentionCount ?? 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const sessionGoals = state.sessionGoals[newGoal.sessionId] || [];
          const updatedGoals = { ...state.goals, [goalId]: newGoal };

          return {
            goals: updatedGoals,
            entities: { ...state.entities, [goalId]: newGoal },
            sessionGoals: {
              ...state.sessionGoals,
              [newGoal.sessionId]: [...sessionGoals, goalId],
            },
            activeGoalIds: updateActiveGoalIds(updatedGoals),
            error: null,
          };
        });

        return goalId;
      },

      update: (goalId, updates) => {
        const existingGoal = get().goals[goalId];
        if (!existingGoal) {
          set({ error: createStoreError('Goal Not Found', 'The specified goal could not be found.') });
          return;
        }

        const normalizedUpdates: Partial<NarrativeGoal> = { ...updates };

        if (updates.title) {
          normalizedUpdates.title = normalizeText(updates.title, NORM_NAME);
        }

        if (updates.description) {
          normalizedUpdates.description = normalizeText(updates.description, NORM_DESC);
        }

        const now = getTimestamp();
        const previousStatus = existingGoal.status;
        const previousSessionId = existingGoal.sessionId;
        const nextSessionId = updates.sessionId ?? previousSessionId;

        const updatedGoal: NarrativeGoal = {
          ...existingGoal,
          ...normalizedUpdates,
          sessionId: nextSessionId,
          updatedAt: now,
        };

        if (updates.status && updates.status !== previousStatus) {
          if (updates.status === 'completed' || updates.status === 'abandoned') {
            updatedGoal.completedAt = new Date(now);
            updatedGoal.completionMethod = updates.status === 'completed' ? 'achieved' : 'abandoned';
          }
        }

        set((state) => {
          const updatedGoals = { ...state.goals, [goalId]: updatedGoal };
          const nextEntities = { ...state.entities, [goalId]: updatedGoal };
          const nextSessionGoals = { ...state.sessionGoals };

          if (previousSessionId !== nextSessionId) {
            const previousList = nextSessionGoals[previousSessionId] || [];
            nextSessionGoals[previousSessionId] = previousList.filter((id) => id !== goalId);

            const nextList = nextSessionGoals[nextSessionId] || [];
            nextSessionGoals[nextSessionId] = [...nextList, goalId];
          }

          return {
            goals: updatedGoals,
            entities: nextEntities,
            sessionGoals: nextSessionGoals,
            activeGoalIds: updateActiveGoalIds(updatedGoals),
            error: null,
          };
        });
      },

      delete: (goalId) => {
        const existingGoal = get().goals[goalId];
        if (!existingGoal) {
          return;
        }

        set((state) => {
          const { [goalId]: _removedGoal, ...remainingGoals } = state.goals;
          const { [goalId]: _removedEntity, ...remainingEntities } = state.entities;

          const sessionGoals = state.sessionGoals[existingGoal.sessionId] || [];
          const updatedSessionGoals = sessionGoals.filter((id) => id !== goalId);

          const nextSessionGoals = {
            ...state.sessionGoals,
            [existingGoal.sessionId]: updatedSessionGoals,
          };

          if (nextSessionGoals[existingGoal.sessionId].length === 0) {
            delete nextSessionGoals[existingGoal.sessionId];
          }

          return {
            goals: remainingGoals,
            entities: remainingEntities,
            sessionGoals: nextSessionGoals,
            activeGoalIds: updateActiveGoalIds(remainingGoals),
            currentEntityId: state.currentEntityId === goalId ? null : state.currentEntityId,
            error: null,
          };
        });
      },

      setCurrent: (id) => {
        if (id && !get().goals[id]) {
          set({
            error: createStoreError('Goal Not Found', 'The specified goal could not be found.'),
            currentEntityId: null,
          });
          return;
        }

        set({ currentEntityId: id ?? null, error: null });
      },

      getById: (id) => get().goals[id],
      getAll: () => Object.values(get().goals),

      reset: () => set(getInitialState()),

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),

      createGoal: (goalData) => get().create(goalData),
      updateGoal: (goalId, updates) => get().update(goalId, updates),
      deleteGoal: (goalId) => get().delete(goalId),

      getActiveGoalsBySession: (sessionId) => {
        const state = get();
        const goalIds = state.sessionGoals[sessionId] || [];
        return goalIds
          .map((id) => state.goals[id])
          .filter((goal): goal is NarrativeGoal => Boolean(goal && goal.status === 'active'));
      },

      getGoalsByPriority: (priority) =>
        Object.values(get().goals).filter((goal) => goal.priority === priority),

      getRecentlyMentionedGoals: (withinMs) => {
        const cutoffTime = Date.now() - withinMs;
        return Object.values(get().goals).filter((goal) => {
          if (!goal.lastMentionedAt) return false;
          const mentionTime = goal.lastMentionedAt instanceof Date ? goal.lastMentionedAt.getTime() : new Date(goal.lastMentionedAt).getTime();
          return mentionTime >= cutoffTime;
        });
      },


      incrementMentionCount: (goalId) => {
        const goal = get().goals[goalId];
        if (!goal) {
          set({ error: createStoreError('Goal Not Found', 'The specified goal could not be found.') });
          return;
        }

        get().update(goalId, {
          mentionCount: goal.mentionCount + 1,
          lastMentionedAt: new Date(),
        });
      },

      addProgressNote: (goalId, note) => {
        const goal = get().goals[goalId];
        if (!goal) {
          set({ error: createStoreError('Goal Not Found', 'The specified goal could not be found.') });
          return;
        }

        const notes = goal.progressNotes ? [...goal.progressNotes, note] : [note];
        get().update(goalId, { progressNotes: notes });
      },

      clearSessionGoals: (sessionId) => {
        const goalIds = get().sessionGoals[sessionId] || [];
        goalIds.forEach((goalId) => get().delete(goalId));
      },

      clearWorldGoals: (worldId) => {
        // Goals without a worldId can't be attributed to the deleted world,
        // so they're left alone.
        Object.values(get().goals)
          .filter((goal) => goal.worldId === worldId)
          .forEach((goal) => get().delete(goal.id));
      },

      processSegmentForGoals: async (segment, sessionId, characterId, worldThreads, worldCost) => {
        set({ loading: true, error: null });
        try {
          if (!segment) {
            const error = createStoreError('Segment Not Found', 'Narrative segment not found for goal processing.', ErrorType.SERVICE, true);
            return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error };
          }

          if (!sessionId) {
            const error = createStoreError('Session Not Found', 'No session could be determined for the provided segment.', ErrorType.SERVICE, true);
            return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error };
          }

          const goalState = get();
          const existingGoals = goalState.sessionGoals[sessionId]
            ?.map((id) => goalState.goals[id])
            .filter((goal): goal is NarrativeGoal => Boolean(goal)) || [];

          const extractionRequest: GoalExtractionRequest = {
            content: segment.content,
            sessionId,
            segmentId: segment.id,
            characterId,
            worldId: segment.worldId,
            existingGoals,
            worldThreads,
            worldCost,
          };

          const extractionResult: GoalExtractionResult =
            await extractGoalsFromNarrative(extractionRequest);

          let newGoalsCreated = 0;
          let goalsUpdated = 0;
          let goalsCompleted = 0;

          for (const newGoal of extractionResult.newGoals) {
            try {
              validateGoalData(newGoal);
              get().createGoal(newGoal);
              newGoalsCreated++;
            } catch {
              // ignore invalid goal
            }
          }

          for (const goalUpdate of extractionResult.updatedGoals) {
            get().updateGoal(goalUpdate.goalId, goalUpdate.updates);
            goalsUpdated++;
          }

          extractionResult.completedGoals.forEach((goalId) => {
            const goal = get().goals[goalId];
            if (goal) {
              get().updateGoal(goalId, { status: 'completed', completionSegmentId: segment.id });
              goalsCompleted++;
            }
          });

          return {
            newGoalsCreated,
            goalsUpdated,
            goalsCompleted,
            worldThreads: extractionResult.worldThreads,
            worldCost: extractionResult.worldCost,
          };
        } catch (error) {
          const friendlyError = createStoreError(
            'Goal Processing Failed',
            error instanceof Error ? error.message : 'Failed to process goals for the segment.',
            ErrorType.SERVICE,
            true
          );
          return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error: friendlyError };
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'narraitor-goal-store',
      storage: createIndexedDBStorage(),
      version: 2, // Incremented to clear old migrated data
      partialize: (state) => ({
        goals: state.goals,
        sessionGoals: state.sessionGoals,
        activeGoalIds: state.activeGoalIds,
      }),
      migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
    }
  )
);

// Cascade cleanup: deleting a world orphans its goals otherwise (mirrors
// characterStore's WORLD_DELETED subscription). Plain subscribe — the handler
// only clears data, so a double-fire is a no-op.
storeEvents.subscribe<WorldDeletedEvent>(
  StoreEventTypes.WORLD_DELETED,
  ({ worldId }) => {
    useGoalStore.getState().clearWorldGoals(worldId);
  }
);
