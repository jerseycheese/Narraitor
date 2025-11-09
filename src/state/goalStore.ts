import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp, filterTruthy } from '@/lib/utils';
import { UserFriendlyError, ErrorType, createStoreError, getErrorMessage } from '@/lib/utils/errorUtils';
import {
  NarrativeGoal,
  GoalPriority,
  GoalExtractionRequest,
  GoalExtractionResult,
} from '../types/goal.types';
import { EntityID } from '../types/common.types';
import { createIndexedDBStorage } from './persistence';
import { goalExtractor } from '../lib/ai/goalExtractor';
import {
  CrudStore,
  createCrudOperations,
  createInitialState,
  createPersistOptions,
} from './createCrudStore';

interface ProcessSegmentResult {
  newGoalsCreated: number;
  goalsUpdated: number;
  goalsCompleted: number;
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
  processSegmentForGoals: (segmentId: EntityID, characterId?: EntityID) => Promise<ProcessSegmentResult>;
}

// Removed getInitialState - now using createInitialState() factory

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
      // Initialize state using factory
      ...createInitialState<NarrativeGoal, GoalStore>({
        domainKey: 'goals',
        additionalInitialState: {
          sessionGoals: {} as Record<EntityID, EntityID[]>,
          activeGoalIds: [] as EntityID[],
        },
      }),

      // Create CRUD operations using factory
      ...createCrudOperations<NarrativeGoal, GoalStore>({
        entityPrefix: 'goal',
        domainKey: 'goals',

        // Hook: Validate and normalize before create
        beforeCreate: (data) => {
          validateGoalData(data);
          return {
            ...data,
            title: normalizeText(data.title, NORM_NAME),
            description: normalizeText(data.description, NORM_DESC),
            mentionCount: data.mentionCount ?? 0,
          };
        },

        // Hook: Update sessionGoals and activeGoalIds after create
        afterCreate: (goal, _set) => {
          _set((state: GoalStore) => {
            const sessionGoals = state.sessionGoals[goal.sessionId] || [];
            const updatedGoals = { ...state.goals, [goal.id]: goal };

            return {
              sessionGoals: {
                ...state.sessionGoals,
                [goal.sessionId]: [...sessionGoals, goal.id],
              },
              activeGoalIds: updateActiveGoalIds(updatedGoals),
            };
          });
        },

        // Hook: Validate and normalize before update
        beforeUpdate: (id, updates, currentGoal) => {
          const normalizedUpdates: Partial<NarrativeGoal> = { ...updates };

          if (updates.title !== undefined) {
            normalizedUpdates.title = normalizeText(updates.title, NORM_NAME);
          }

          if (updates.description !== undefined) {
            normalizedUpdates.description = normalizeText(updates.description, NORM_DESC);
          }

          // Handle status changes for completion
          if (updates.status && updates.status !== currentGoal.status) {
            if (updates.status === 'completed' || updates.status === 'abandoned') {
              normalizedUpdates.completedAt = new Date(getTimestamp());
              normalizedUpdates.completionMethod = updates.status === 'completed' ? 'achieved' : 'abandoned';
            }
          }

          return normalizedUpdates;
        },

        // Hook: Update sessionGoals and activeGoalIds after update if session changed
        afterUpdate: (goal, _set, _get) => {
          const state = _get() as GoalStore;
          const oldGoal = state.entities[goal.id];

          _set((s: GoalStore) => {
            const updatedGoals = { ...s.goals, [goal.id]: goal };
            const nextSessionGoals = { ...s.sessionGoals };

            // Handle session changes
            if (oldGoal && oldGoal.sessionId !== goal.sessionId) {
              const previousList = nextSessionGoals[oldGoal.sessionId] || [];
              nextSessionGoals[oldGoal.sessionId] = previousList.filter((id) => id !== goal.id);

              const nextList = nextSessionGoals[goal.sessionId] || [];
              nextSessionGoals[goal.sessionId] = [...nextList, goal.id];
            }

            return {
              sessionGoals: nextSessionGoals,
              activeGoalIds: updateActiveGoalIds(updatedGoals),
            };
          });
        },

        // Hook: Update sessionGoals and activeGoalIds after delete
        afterDelete: (id, _set, _get) => {
          const state = _get() as GoalStore;
          const goal = state.entities[id];

          if (goal) {
            _set((s: GoalStore) => {
              const sessionGoals = s.sessionGoals[goal.sessionId] || [];
              const updatedSessionGoals = sessionGoals.filter((goalId) => goalId !== id);

              const nextSessionGoals = {
                ...s.sessionGoals,
                [goal.sessionId]: updatedSessionGoals,
              };

              if (nextSessionGoals[goal.sessionId].length === 0) {
                delete nextSessionGoals[goal.sessionId];
              }

              const remainingGoals = { ...s.goals };
              delete remainingGoals[id];

              return {
                sessionGoals: nextSessionGoals,
                activeGoalIds: updateActiveGoalIds(remainingGoals),
              };
            });
          }
        },
      })(set, get),

      // Domain-specific aliases
      createGoal: (goalData) => get().create(goalData),
      updateGoal: (goalId, updates) => get().update(goalId, updates),
      deleteGoal: (goalId) => get().delete(goalId),

      getActiveGoalsBySession: (sessionId) => {
        const state = get();
        const goalIds = state.sessionGoals[sessionId] || [];
        return goalIds
          .map((id) => state.goals[id])
          .filter(filterTruthy).filter((goal) => goal.status === 'active');
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

      processSegmentForGoals: async (segmentId, characterId) => {
        set({ loading: true, error: null });
        try {
          const { useNarrativeStore } = await import('./narrativeStore');
          const narrativeState = useNarrativeStore.getState();
          const segment = narrativeState.segments[segmentId];

          if (!segment) {
            const error = createStoreError('Segment Not Found', 'Narrative segment not found for goal processing.', ErrorType.SERVICE, true);
            return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error };
          }

          const sessionId = Object.keys(narrativeState.sessionSegments).find((session) =>
            narrativeState.sessionSegments[session]?.includes(segmentId)
          );

          if (!sessionId) {
            const error = createStoreError('Session Not Found', 'No session could be determined for the provided segment.', ErrorType.SERVICE, true);
            return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error };
          }

          const goalState = get();
          const existingGoals = goalState.sessionGoals[sessionId]
            ?.map((id) => goalState.goals[id])
            .filter(filterTruthy) || [];

          const extractionRequest: GoalExtractionRequest = {
            content: segment.content,
            sessionId,
            segmentId,
            characterId,
            worldId: segment.worldId,
            existingGoals,
          };

          const extractionResult: GoalExtractionResult =
            await goalExtractor.extractGoalsFromNarrative(extractionRequest);

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
              get().updateGoal(goalId, { status: 'completed', completionSegmentId: segmentId });
              goalsCompleted++;
            }
          });

          return { newGoalsCreated, goalsUpdated, goalsCompleted };
        } catch (error) {
          const friendlyError = createStoreError(
            'Goal Processing Failed',
            getErrorMessage(error, 'Failed to process goals for the segment.'),
            ErrorType.SERVICE,
            true
          );
          return { newGoalsCreated: 0, goalsUpdated: 0, goalsCompleted: 0, error: friendlyError };
        } finally {
          set({ loading: false });
        }
      },
    }),

    // Persistence configuration using factory
    {
      ...createPersistOptions<GoalStore>('goal', 'goals', createIndexedDBStorage(), 1),
      partialize: (state) => ({
        goals: state.goals,
        sessionGoals: state.sessionGoals,
        activeGoalIds: state.activeGoalIds,
      }),
    }
  )
);
