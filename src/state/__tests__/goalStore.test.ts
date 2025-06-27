// src/state/__tests__/goalStore.test.ts

import { useGoalStore } from '../goalStore';
import { NarrativeGoal, GoalStatus, GoalPriority, GoalType } from '../../types/goal.types';

describe('goalStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGoalStore.setState({
      goals: {},
      sessionGoals: {},
      activeGoalIds: [],
      error: null,
      loading: false,
    });
  });

  describe('Goal CRUD Operations', () => {
    test('should create a new goal with generated ID', () => {
      const goalData = {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        title: 'Investigate the mysterious hole',
        description: 'Found a strange hole in the wall that needs investigation',
        type: 'exploration' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      };

      const goalId = useGoalStore.getState().createGoal(goalData);
      const state = useGoalStore.getState();

      expect(goalId).toBeDefined();
      expect(state.goals[goalId]).toBeDefined();
      expect(state.goals[goalId].title).toBe('Investigate the mysterious hole');
      expect(state.goals[goalId].status).toBe('active');
      expect(state.goals[goalId].priority).toBe('high');
      expect(state.goals[goalId].createdAt).toBeDefined();
      expect(state.sessionGoals['session-123']).toContain(goalId);
      expect(state.activeGoalIds).toContain(goalId);
    });

    test('should update goal status and track completion', () => {
      const goalData = {
        sessionId: 'session-123',
        title: 'Find the key',
        description: 'Search for the missing key',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
      };

      const goalId = useGoalStore.getState().createGoal(goalData);
      
      // Complete the goal
      useGoalStore.getState().updateGoal(goalId, {
        status: 'completed',
        completionMethod: 'achieved',
        progressNotes: ['Found key in drawer']
      });

      const state = useGoalStore.getState();
      const updatedGoal = state.goals[goalId];

      expect(updatedGoal.status).toBe('completed');
      expect(updatedGoal.completionMethod).toBe('achieved');
      expect(updatedGoal.completedAt).toBeDefined();
      expect(updatedGoal.progressNotes).toContain('Found key in drawer');
      expect(state.activeGoalIds).not.toContain(goalId);
    });

    test('should delete goal and clean up references', () => {
      const goalData = {
        sessionId: 'session-123',
        title: 'Test goal',
        description: 'Test description',
        type: 'immediate' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      };

      const goalId = useGoalStore.getState().createGoal(goalData);
      useGoalStore.getState().deleteGoal(goalId);

      const state = useGoalStore.getState();
      expect(state.goals[goalId]).toBeUndefined();
      expect(state.sessionGoals['session-123']).not.toContain(goalId);
      expect(state.activeGoalIds).not.toContain(goalId);
    });
  });

  describe('Goal Retrieval', () => {
    test('should get active goals for session', () => {
      const session1 = 'session-123';
      const session2 = 'session-456';

      // Create goals for different sessions
      const goal1Id = useGoalStore.getState().createGoal({
        sessionId: session1,
        title: 'Goal 1',
        description: 'Active goal',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      const goal2Id = useGoalStore.getState().createGoal({
        sessionId: session1,
        title: 'Goal 2',
        description: 'Completed goal',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'completed' as GoalStatus,
        mentionCount: 2,
      });

      const goal3Id = useGoalStore.getState().createGoal({
        sessionId: session2,
        title: 'Goal 3',
        description: 'Different session goal',
        type: 'social' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      const activeGoals = useGoalStore.getState().getActiveGoalsBySession(session1);
      
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe(goal1Id);
      expect(activeGoals[0].status).toBe('active');
    });

    test('should get goals by priority', () => {
      // Create goals with different priorities
      useGoalStore.getState().createGoal({
        sessionId: 'session-123',
        title: 'Critical Goal',
        description: 'Very important',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      useGoalStore.getState().createGoal({
        sessionId: 'session-123',
        title: 'Low Priority Goal',
        description: 'Not urgent',
        type: 'social' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      const criticalGoals = useGoalStore.getState().getGoalsByPriority('critical');
      const lowGoals = useGoalStore.getState().getGoalsByPriority('low');

      expect(criticalGoals).toHaveLength(1);
      expect(criticalGoals[0].title).toBe('Critical Goal');
      expect(lowGoals).toHaveLength(1);
      expect(lowGoals[0].title).toBe('Low Priority Goal');
    });

    test('should get recently mentioned goals', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Create goals with different mention times
      const recentGoalId = useGoalStore.getState().createGoal({
        sessionId: 'session-123',
        title: 'Recent Goal',
        description: 'Recently mentioned',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
        lastMentionedAt: oneHourAgo,
      });

      const oldGoalId = useGoalStore.getState().createGoal({
        sessionId: 'session-123',
        title: 'Old Goal',
        description: 'Long time since mention',
        type: 'exploration' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        lastMentionedAt: twoDaysAgo,
      });

      const recentGoals = useGoalStore.getState().getRecentlyMentionedGoals(2 * 60 * 60 * 1000); // 2 hours

      expect(recentGoals).toHaveLength(1);
      expect(recentGoals[0].id).toBe(recentGoalId);
    });
  });

  describe('Goal Status Transitions', () => {
    test('should validate status transitions', () => {
      const goalData = {
        sessionId: 'session-123',
        title: 'Test Goal',
        description: 'Test description',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      };

      const goalId = useGoalStore.getState().createGoal(goalData);

      // Valid transition: active -> completed
      expect(() => {
        useGoalStore.getState().updateGoal(goalId, { status: 'completed' });
      }).not.toThrow();

      // Reset for next test
      useGoalStore.getState().updateGoal(goalId, { status: 'active' });

      // Valid transition: active -> abandoned
      expect(() => {
        useGoalStore.getState().updateGoal(goalId, { status: 'abandoned' });
      }).not.toThrow();
    });

    test('should track goal progress with notes', () => {
      const goalData = {
        sessionId: 'session-123',
        title: 'Complex Quest',
        description: 'Multi-step quest',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        progressNotes: ['Started investigating'],
      };

      const goalId = useGoalStore.getState().createGoal(goalData);

      // Add progress notes
      useGoalStore.getState().addProgressNote(goalId, 'Found first clue');
      useGoalStore.getState().addProgressNote(goalId, 'Met important character');

      const goal = useGoalStore.getState().goals[goalId];
      expect(goal.progressNotes).toHaveLength(3);
      expect(goal.progressNotes).toContain('Found first clue');
      expect(goal.progressNotes).toContain('Met important character');
    });
  });

  describe('Session Management', () => {
    test('should clear session goals', () => {
      const sessionId = 'session-123';

      // Create multiple goals for the session
      const goal1Id = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Goal 1',
        description: 'First goal',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      const goal2Id = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Goal 2',
        description: 'Second goal',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      // Clear session goals
      useGoalStore.getState().clearSessionGoals(sessionId);

      const state = useGoalStore.getState();
      expect(state.goals[goal1Id]).toBeUndefined();
      expect(state.goals[goal2Id]).toBeUndefined();
      expect(state.sessionGoals[sessionId]).toBeUndefined();
      expect(state.activeGoalIds).not.toContain(goal1Id);
      expect(state.activeGoalIds).not.toContain(goal2Id);
    });

    test('should update mention count and timestamp', () => {
      const goalData = {
        sessionId: 'session-123',
        title: 'Trackable Goal',
        description: 'Goal that gets mentioned',
        type: 'mystery' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      };

      const goalId = useGoalStore.getState().createGoal(goalData);
      const initialMentionCount = useGoalStore.getState().goals[goalId].mentionCount;

      // Mention the goal
      useGoalStore.getState().incrementMentionCount(goalId);

      const updatedGoal = useGoalStore.getState().goals[goalId];
      expect(updatedGoal.mentionCount).toBe(initialMentionCount + 1);
      expect(updatedGoal.lastMentionedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid goal updates', () => {
      expect(() => {
        useGoalStore.getState().updateGoal('nonexistent-id', { title: 'New Title' });
      }).toThrow('Goal not found');
    });

    test('should validate required fields', () => {
      expect(() => {
        useGoalStore.getState().createGoal({
          sessionId: 'session-123',
          title: '', // Empty title should fail
          description: 'Test description',
          type: 'quest' as GoalType,
          priority: 'medium' as GoalPriority,
          status: 'active' as GoalStatus,
          mentionCount: 1,
        });
      }).toThrow();
    });

    test('should handle persistence errors gracefully', () => {
      // Simulate error by setting error state
      useGoalStore.getState().setError('Persistence failed');
      expect(useGoalStore.getState().error).toBe('Persistence failed');
      
      // Clear error
      useGoalStore.getState().clearError();
      expect(useGoalStore.getState().error).toBeNull();
    });
  });
});