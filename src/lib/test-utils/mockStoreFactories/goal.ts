import type { GoalStore } from './types';

export function createMockGoalStore(
  overrides?: Partial<GoalStore>
): GoalStore {
  return {
    goals: {},
    entities: {},
    sessionGoals: {},
    activeGoalIds: [],
    currentEntityId: null,
    error: null,
    loading: false,
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setCurrent: jest.fn(),
    getById: jest.fn(() => undefined),
    getAll: jest.fn(() => []),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getActiveGoalsBySession: jest.fn(() => []),
    getGoalsByPriority: jest.fn(() => []),
    getRecentlyMentionedGoals: jest.fn(() => []),
    incrementMentionCount: jest.fn(),
    addProgressNote: jest.fn(),
    clearSessionGoals: jest.fn(),
    processSegmentForGoals: jest.fn().mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0,
    }),
    ...overrides,
  } as GoalStore;
}
