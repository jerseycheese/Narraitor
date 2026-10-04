import { useAiContextStore } from '../aiContextStore';
import { useGoalStore } from '../goalStore';
import { GoalPriority, GoalStatus, GoalType } from '@/types/goal.types';

describe('aiContextStore', () => {
  const sessionId = 'session-test-123';

  beforeEach(() => {
    useAiContextStore.getState().reset();
    useGoalStore.getState().reset();
  });

  afterEach(() => {
    useAiContextStore.getState().reset();
    useGoalStore.getState().reset();
  });

  describe('buildContextForSession', () => {
    test('seeds real goalStore and includes active goals in priority order', async () => {
      // Seed real goalStore with multiple goals of different priorities
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Gather supplies for winter',
        description: 'Collect firewood and food before the frost hits',
        contextSummary: 'Gather supplies for winter',
        type: 'survival' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 0,
      });

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Stop the dark ritual',
        description: 'Prevent cultists from summoning the entity at midnight',
        contextSummary: 'Stop the dark ritual before midnight',
        type: 'quest' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        progressNotes: ['Found the hidden chamber entrance'],
      });

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Investigate the ruins',
        description: 'Explore the collapsed tower in the woods',
        contextSummary: 'Investigate the collapsed tower',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 0,
      });

      // Also create a completed goal for the same session to verify filtering
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Escape the prison cell',
        description: 'Find a way out of the dungeon lockup',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'completed' as GoalStatus,
        mentionCount: 2,
      });

      const context = await useAiContextStore
        .getState()
        .buildContextForSession(sessionId);

      expect(context.sessionId).toBe(sessionId);
      expect(context.error).toBeNull();
      expect(context.activeGoals).toHaveLength(3);
      expect(context.criticalGoals).toHaveLength(1);
      expect(context.criticalGoals[0].title).toBe('Stop the dark ritual');

      // Critical priority goal must be ordered first and carry URGENT prefix
      expect(context.goalContext).toContain('ACTIVE GOALS:');
      expect(context.goalContext).toContain(
        'URGENT: Stop the dark ritual before midnight Progress: Found the hidden chamber entrance'
      );
      expect(context.goalContext).toContain('Gather supplies for winter');
      expect(context.goalContext).toContain('Investigate the collapsed tower');
      expect(context.goalContext).not.toContain('Escape the prison cell');

      // Assert ordering in activeGoals: critical -> medium -> low
      expect(context.activeGoals[0].priority).toBe('critical');
      expect(context.activeGoals[1].priority).toBe('medium');
      expect(context.activeGoals[2].priority).toBe('low');
    });

    test('drops lower-priority goals when maxChars limit is reached', async () => {
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Defend the fortress gates',
        description: 'The front gates are under immediate siege',
        contextSummary: 'Defend the fortress gates from breach',
        type: 'quest' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 0,
      });

      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Collect extra herbs',
        description: 'Look for rare nightshade in the nearby marsh',
        contextSummary: 'Collect extra herbs in the marsh',
        type: 'exploration' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 0,
      });

      // Restrict maxChars so only the critical goal fits with header
      // 'ACTIVE GOALS:\n' is 14 chars. 'URGENT: Defend the fortress gates from breach\n' is 46 chars. Total = 60.
      const context = await useAiContextStore
        .getState()
        .buildContextForSession(sessionId, { maxChars: 65 });

      expect(context.activeGoals).toHaveLength(1);
      expect(context.activeGoals[0].priority).toBe('critical');
      expect(context.goalContext).toContain('Defend the fortress gates');
      expect(context.goalContext).not.toContain('Collect extra herbs');
    });

    test('returns empty context when includeGoals is false', async () => {
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Active quest',
        description: 'Should not appear when disabled',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 0,
      });

      const context = await useAiContextStore
        .getState()
        .buildContextForSession(sessionId, { includeGoals: false });

      expect(context.goalContext).toBe('');
      expect(context.contextText).toBe('');
      expect(context.activeGoals).toEqual([]);
      expect(context.criticalGoals).toEqual([]);
    });

    test('returns empty context when session has no active goals', async () => {
      const context = await useAiContextStore
        .getState()
        .buildContextForSession('session-with-no-goals');

      expect(context.goalContext).toBe('');
      expect(context.activeGoals).toEqual([]);
      expect(context.criticalGoals).toEqual([]);
      expect(context.error).toBeNull();
    });
  });

  describe('store state management', () => {
    test('supports setting and clearing error and loading states', () => {
      const store = useAiContextStore.getState();

      store.setError('Test error');
      expect(useAiContextStore.getState().error).toBe('Test error');

      store.clearError();
      expect(useAiContextStore.getState().error).toBeNull();

      store.setLoading(true);
      expect(useAiContextStore.getState().loading).toBe(true);

      store.reset();
      expect(useAiContextStore.getState().loading).toBe(false);
      expect(useAiContextStore.getState().error).toBeNull();
    });
  });
});
