// src/state/__tests__/aiContextStore.goalIntegration.test.ts

import { useAiContextStore } from '../aiContextStore';
import { useGoalStore } from '../goalStore';
import { useNarrativeStore } from '../narrativeStore';
import { GoalType, GoalPriority, GoalStatus } from '../../types/goal.types';

describe('aiContextStore - Goal Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useAiContextStore.setState({
      context: {},
      contextHistory: [],
      loading: false,
      error: null,
    });

    useGoalStore.setState({
      goals: {},
      sessionGoals: {},
      activeGoalIds: [],
      error: null,
      loading: false,
    });

    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      endedSessions: {},
      currentEnding: null,
      isGeneratingEnding: false,
      endingError: null,
      error: null,
      loading: false,
    });
  });

  describe('Goal Context Building', () => {
    test('should include active goals in AI context', () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';
      const worldId = 'world-789';

      // Create active goals
      const criticalGoalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        worldId,
        title: 'Escape the burning building',
        description: 'The building is on fire and you need to get out immediately',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'URGENT: Player must escape burning building immediately',
        keywords: ['fire', 'escape', 'building', 'urgent'],
      });

      const questGoalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        worldId,
        title: 'Find the magical sword',
        description: 'Locate the legendary sword hidden in the temple',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 3,
        contextSummary: 'Player is searching for legendary sword in temple',
        keywords: ['sword', 'magical', 'temple', 'legendary'],
        progressNotes: ['Entered the temple', 'Found ancient inscriptions'],
      });

      // Build context for AI generation
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 1000,
      });

      expect(context.goalContext).toBeDefined();
      expect(context.goalContext).toContain('burning building');
      expect(context.goalContext).toContain('magical sword');
      expect(context.activeGoals).toHaveLength(2);
      expect(context.criticalGoals).toHaveLength(1);
      expect(context.criticalGoals[0].id).toBe(criticalGoalId);
    });

    test('should prioritize goals by importance in limited token budget', () => {
      const sessionId = 'session-123';

      // Create goals with different priorities
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Buy groceries',
        description: 'Pick up food from the market',
        type: 'social' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player should buy groceries when convenient',
      });

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Stop the ritual',
        description: 'Prevent the dark ritual from completing',
        type: 'quest' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
        contextSummary: 'CRITICAL: Dark ritual must be stopped immediately',
      });

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Repair equipment',
        description: 'Fix the broken armor',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player needs to repair damaged armor',
      });

      // Build context with very limited tokens
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 100, // Very limited
      });

      // Should prioritize critical goals
      expect(context.goalContext).toContain('ritual');
      expect(context.goalContext).not.toContain('groceries');
      expect(context.criticalGoals).toHaveLength(1);
    });

    test('should include recently mentioned goals', () => {
      const sessionId = 'session-123';
      const now = new Date();
      const recentTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago (well within 30 minute window)
      const oldTime = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago

      // Create goals with different mention times
      const recentGoalId = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Recently mentioned goal',
        description: 'This goal was mentioned recently',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
        lastMentionedAt: recentTime,
        contextSummary: 'Player recently discussed this exploration goal',
      });

      const oldGoalId = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Old goal',
        description: 'This goal was mentioned long ago',
        type: 'social' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        lastMentionedAt: oldTime,
        contextSummary: 'Player mentioned this goal a while ago',
      });

      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        prioritizeRecent: true,
      });

      expect(context.recentGoals).toHaveLength(1);
      expect(context.recentGoals[0].id).toBe(recentGoalId);
      expect(context.goalContext).toContain('recently discussed');
    });

    test('should format goal context for AI prompt consumption', () => {
      const sessionId = 'session-123';

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Investigate the mysterious cave',
        description: 'Strange sounds are coming from the cave entrance',
        type: 'exploration' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player discovered mysterious cave with strange sounds',
        keywords: ['cave', 'mysterious', 'sounds', 'investigate'],
        progressNotes: ['Found cave entrance', 'Heard strange echoes'],
      });

      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      // Context should be well-formatted for AI consumption
      expect(context.goalContext).toMatch(/ACTIVE GOALS:/);
      expect(context.goalContext).toContain('mysterious cave');
      expect(context.goalContext).toContain('strange sounds');
      expect(context.goalContext).toContain('Progress: Found cave entrance');
      expect(context.tokenCount).toBeGreaterThan(0);
    });
  });

  describe('Context History with Goals', () => {
    test('should track goal context changes over time', () => {
      const sessionId = 'session-123';

      // Initial context with one goal
      const goalId1 = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Initial goal',
        description: 'Starting objective',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player has initial objective',
      });

      const context1 = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      useAiContextStore.getState().saveContextToHistory(sessionId, context1);

      // Add another goal
      const goalId2 = useGoalStore.getState().createGoal({
        sessionId,
        title: 'New urgent goal',
        description: 'Urgent new objective',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'URGENT: New critical objective appeared',
      });

      const context2 = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      useAiContextStore.getState().saveContextToHistory(sessionId, context2);

      const history = useAiContextStore.getState().getContextHistory(sessionId);

      expect(history).toHaveLength(2);
      expect(history[0].goalContext).toContain('Initial goal');
      expect(history[0].goalContext).not.toContain('urgent goal');
      expect(history[1].goalContext).toContain('Initial goal');
      expect(history[1].goalContext).toContain('urgent goal');
      expect(history[1].criticalGoals).toHaveLength(1);
    });

    test('should maintain goal context consistency across generations', () => {
      const sessionId = 'session-123';

      // Create persistent goal
      const goalId = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Find the ancient artifact',
        description: 'Locate the powerful artifact for the quest',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player seeks ancient artifact for main quest',
        keywords: ['artifact', 'ancient', 'quest', 'powerful'],
      });

      // Generate multiple contexts
      const contexts = [];
      for (let i = 0; i < 3; i++) {
        const context = useAiContextStore.getState().buildContextForSession(sessionId, {
          includeGoals: true,
        });
        contexts.push(context);
        useAiContextStore.getState().saveContextToHistory(sessionId, context);

        // Update mention count (simulating goal being referenced)
        useGoalStore.getState().incrementMentionCount(goalId);
      }

      // All contexts should include the persistent goal
      contexts.forEach(context => {
        expect(context.goalContext).toContain('ancient artifact');
        expect(context.activeGoals).toHaveLength(1);
        expect(context.activeGoals[0].id).toBe(goalId);
      });

      // Mention count should have increased
      const finalGoal = useGoalStore.getState().goals[goalId];
      expect(finalGoal.mentionCount).toBe(4); // Initial 1 + 3 increments
    });
  });

  describe('Performance and Token Management', () => {
    test('should respect token limits for goal context', () => {
      const sessionId = 'session-123';

      // Create many goals to test token limiting
      for (let i = 0; i < 10; i++) {
        useGoalStore.getState().createGoal({
          sessionId,
          title: `Goal ${i}`,
          description: `This is a very long description for goal ${i} that contains many words and details about the objective to test token limiting functionality`,
          type: 'quest' as GoalType,
          priority: i < 3 ? 'critical' : i < 6 ? 'high' : 'medium',
          status: 'active' as GoalStatus,
          mentionCount: 1,
          contextSummary: `Player has objective ${i} with detailed requirements and background information`,
        });
      }

      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 200, // Strict limit
      });

      expect(context.tokenCount).toBeLessThanOrEqual(200);
      // Should prioritize critical goals
      expect(context.criticalGoals).toHaveLength(3);
      expect(context.goalContext).toContain('Goal 0');
      expect(context.goalContext).toContain('Goal 1');
      expect(context.goalContext).toContain('Goal 2');
    });

    test('should optimize goal context for performance', () => {
      const sessionId = 'session-123';
      const startTime = Date.now();

      // Create moderate number of goals
      for (let i = 0; i < 50; i++) {
        useGoalStore.getState().createGoal({
          sessionId,
          title: `Performance Test Goal ${i}`,
          description: `Goal description ${i}`,
          type: 'quest' as GoalType,
          priority: 'medium' as GoalPriority,
          status: 'active' as GoalStatus,
          mentionCount: Math.floor(Math.random() * 5) + 1,
          contextSummary: `Context for goal ${i}`,
        });
      }

      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 500,
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (< 100ms for 50 goals)
      expect(executionTime).toBeLessThan(100);
      expect(context.activeGoals.length).toBeGreaterThan(0);
      expect(context.tokenCount).toBeLessThanOrEqual(500);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing goals gracefully', () => {
      const sessionId = 'session-123';

      // Try to build context with no goals
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      expect(context.goalContext).toBe('');
      expect(context.activeGoals).toHaveLength(0);
      expect(context.criticalGoals).toHaveLength(0);
      expect(context.recentGoals).toHaveLength(0);
      expect(context.tokenCount).toBe(0);
    });

    test('should handle corrupted goal data', () => {
      const sessionId = 'session-123';

      // Create goal then corrupt it
      const goalId = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Valid goal',
        description: 'This goal will be corrupted',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      // Directly corrupt the goal data
      useGoalStore.setState(state => ({
        ...state,
        goals: {
          ...state.goals,
          [goalId]: {
            ...state.goals[goalId],
            title: null as any, // Corrupt data
            priority: 'invalid' as any,
          }
        }
      }));

      // Should handle gracefully without crashing
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      expect(context).toBeDefined();
      expect(context.activeGoals).toHaveLength(0); // Corrupted goal should be filtered out
    });

    test('should handle goal store errors', () => {
      const sessionId = 'session-123';

      // Set error state in goal store
      useGoalStore.getState().setError('Goal store error');

      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });

      // Should still provide valid context structure
      expect(context.goalContext).toBeDefined();
      expect(context.activeGoals).toBeDefined();
      expect(context.error).toBeNull(); // AI context shouldn't inherit goal store errors
    });
  });
});