// src/state/__tests__/integration/goalNarrativeIntegration.test.ts

import { useGoalStore } from '../../goalStore';
import { useNarrativeStore } from '../../narrativeStore';
import { useAiContextStore } from '../../aiContextStore';
import { goalExtractor } from '../../../lib/ai/goalExtractor';
import { NarrativeGoal, GoalType, GoalPriority, GoalStatus } from '../../../types/goal.types';

// Mock the goal extractor
jest.mock('../../../lib/ai/goalExtractor');

describe('Goal and Narrative Integration', () => {
  beforeEach(() => {
    // Reset all stores
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

    useAiContextStore.setState({
      context: {},
      contextHistory: [],
      loading: false,
      error: null,
    });

    jest.clearAllMocks();
  });

  describe('Goal Context in AI Prompts', () => {
    test('should include active goals in narrative generation context', () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create active goals
      const goalId1 = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Investigate the mysterious hole',
        description: 'Found a strange hole in the wall that needs investigation',
        type: 'exploration' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
        contextSummary: 'Player discovered a mysterious hole and needs to investigate it',
        keywords: ['hole', 'wall', 'mysterious', 'investigate'],
      });

      const goalId2 = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Find Sarah',
        description: 'Sarah went missing and needs to be found',
        type: 'quest' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'URGENT: Sarah is missing and must be found',
        keywords: ['Sarah', 'missing', 'find'],
      });

      // Build context for AI
      const contextData = useAiContextStore.getState().buildContextForSession(sessionId);

      expect(contextData.activeGoals).toHaveLength(2);
      expect(contextData.activeGoals.some(g => g.id === goalId1)).toBe(true);
      expect(contextData.activeGoals.some(g => g.id === goalId2)).toBe(true);
      expect(contextData.goalContext).toContain('mysterious hole');
      expect(contextData.goalContext).toContain('Sarah is missing');
    });

    test('should prioritize critical goals in context', () => {
      const sessionId = 'session-123';

      // Create goals with different priorities
      useGoalStore.getState().createGoal({
        sessionId,
        title: 'Buy supplies',
        description: 'Get some basic supplies from the market',
        type: 'social' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player should buy supplies when convenient',
      });

      const criticalGoalId = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Escape the fire',
        description: 'Building is on fire, must escape immediately',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'CRITICAL: Building on fire, immediate escape required',
      });

      const contextData = useAiContextStore.getState().buildContextForSession(sessionId, { maxTokens: 100 });

      // With limited tokens, critical goals should be prioritized
      expect(contextData.goalContext).toContain('fire');
      expect(contextData.goalContext).not.toContain('supplies');
      expect(contextData.criticalGoals).toHaveLength(1);
      expect(contextData.criticalGoals[0].id).toBe(criticalGoalId);
    });
  });

  describe('Goal Extraction from Narrative', () => {
    test('should extract goals when adding narrative segments', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Mock goal extraction
      const mockExtractionResult = {
        newGoals: [{
          sessionId,
          characterId,
          title: 'Investigate the basement',
          description: 'Strange noises are coming from the basement',
          type: 'exploration' as GoalType,
          priority: 'medium' as GoalPriority,
          status: 'active' as GoalStatus,
          mentionCount: 1,
          keywords: ['basement', 'noises', 'investigate'],
        }],
        updatedGoals: [],
        completedGoals: [],
        confidence: 0.85,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockExtractionResult);

      // Add a narrative segment
      const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'You hear strange scratching noises coming from the basement below. The sounds are rhythmic, almost like someone is trying to dig through something.',
        type: 'scene',
        metadata: {
          tags: ['mystery', 'basement'],
          mood: 'mysterious',
        },
      });

      // Process goals from the segment
      const result = await useGoalStore.getState().processSegmentForGoals(segmentId, characterId);

      expect(goalExtractor.extractGoalsFromNarrative).toHaveBeenCalled();
      expect(result.newGoalsCreated).toBe(1);
      
      const goals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(goals).toHaveLength(1);
      expect(goals[0].title).toBe('Investigate the basement');
    });

    test('should update existing goals when mentioned in narrative', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create existing goal
      const existingGoalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Find the ancient key',
        description: 'Search for the key to unlock the temple door',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        keywords: ['key', 'ancient', 'temple'],
      });

      // Mock goal extraction result showing progress
      const mockExtractionResult = {
        newGoals: [],
        updatedGoals: [{
          goalId: existingGoalId,
          updates: {
            mentionCount: 2,
            progressNotes: ['Found a clue about the key location'],
            lastMentionedAt: new Date(),
          }
        }],
        completedGoals: [],
        confidence: 0.9,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockExtractionResult);

      // Add segment mentioning the goal
      const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'The old librarian mentions that the ancient key was last seen in the crystal caves to the north.',
        type: 'dialogue',
        metadata: {
          tags: ['key', 'clue'],
          mood: 'neutral',
        },
      });

      await useGoalStore.getState().processSegmentForGoals(segmentId, characterId);

      const updatedGoal = useGoalStore.getState().goals[existingGoalId];
      expect(updatedGoal.mentionCount).toBe(2);
      expect(updatedGoal.progressNotes).toContain('Found a clue about the key location');
      expect(updatedGoal.lastMentionedAt).toBeDefined();
    });

    test('should mark goals as completed when achieved in narrative', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create goal that will be completed
      const goalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Open the locked door',
        description: 'Find a way to open the mysterious locked door',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 3,
        keywords: ['door', 'locked', 'open'],
      });

      // Mock goal completion detection
      const mockExtractionResult = {
        newGoals: [],
        updatedGoals: [{
          goalId,
          updates: {
            status: 'completed' as GoalStatus,
            completionMethod: 'achieved',
            completedAt: new Date(),
          }
        }],
        completedGoals: [goalId],
        confidence: 0.95,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockExtractionResult);

      // Add segment showing goal completion
      const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'You turn the key and the door swings open with a loud creak, revealing the treasure chamber beyond.',
        type: 'action',
        metadata: {
          tags: ['success', 'door', 'treasure'],
          mood: 'triumphant',
        },
      });

      await useGoalStore.getState().processSegmentForGoals(segmentId, characterId);

      const completedGoal = useGoalStore.getState().goals[goalId];
      expect(completedGoal.status).toBe('completed');
      expect(completedGoal.completionMethod).toBe('achieved');
      expect(completedGoal.completedAt).toBeDefined();
      
      const activeGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(activeGoals.find(g => g.id === goalId)).toBeUndefined();
    });
  });

  describe('Cross-Store State Management', () => {
    test('should maintain goal consistency across session operations', () => {
      const sessionId = 'session-123';

      // Create goals for the session
      const goalId1 = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Goal 1',
        description: 'First goal',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      const goalId2 = useGoalStore.getState().createGoal({
        sessionId,
        title: 'Goal 2',
        description: 'Second goal',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
      });

      // Create narrative segments
      useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'First segment',
        type: 'scene',
        metadata: { tags: ['test'] },
      });

      // Clear session from narrative store
      useNarrativeStore.getState().clearSessionSegments(sessionId);

      // Goals should still exist
      expect(useGoalStore.getState().goals[goalId1]).toBeDefined();
      expect(useGoalStore.getState().goals[goalId2]).toBeDefined();

      // Clear goals separately
      useGoalStore.getState().clearSessionGoals(sessionId);

      // Now goals should be gone
      expect(useGoalStore.getState().goals[goalId1]).toBeUndefined();
      expect(useGoalStore.getState().goals[goalId2]).toBeUndefined();
    });

    test('should include goal context in AI prompts before narrative generation', () => {
      const sessionId = 'session-123';
      const worldId = 'world-789';
      const characterId = 'char-456';

      // Create critical goal
      useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        worldId,
        title: 'Escape the dungeon',
        description: 'Find a way out of the dangerous dungeon',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player is trapped in dungeon and must escape',
        keywords: ['dungeon', 'escape', 'trapped'],
      });

      // Build AI context
      const contextData = useAiContextStore.getState().buildContextForSession(sessionId);

      // Verify goal context is included
      expect(contextData.goalContext).toContain('escape');
      expect(contextData.goalContext).toContain('dungeon');
      expect(contextData.activeGoals).toHaveLength(1);
      expect(contextData.criticalGoals).toHaveLength(1);

      // Context should be ready for narrative generation
      expect(contextData.tokenCount).toBeGreaterThan(0);
      expect(contextData.contextText).toContain('trapped in dungeon');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle goal extraction failures gracefully', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Mock extraction failure
      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      // Add narrative segment
      const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'Some narrative content',
        type: 'scene',
        metadata: { tags: ['test'] },
      });

      // Should not throw error
      const result = await useGoalStore.getState().processSegmentForGoals(segmentId, characterId);

      expect(result.error).toBeDefined();
      expect(result.newGoalsCreated).toBe(0);

      // Store should still be functional
      const goals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(goals).toHaveLength(0);
    });

    test('should validate goal data before creating from extraction', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Mock extraction with invalid data
      const mockExtractionResult = {
        newGoals: [{
          sessionId,
          characterId,
          title: '', // Invalid empty title
          description: 'Invalid goal',
          type: 'quest' as GoalType,
          priority: 'medium' as GoalPriority,
          status: 'active' as GoalStatus,
          mentionCount: 1,
        }],
        updatedGoals: [],
        completedGoals: [],
        confidence: 0.5,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockExtractionResult);

      const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'Some content',
        type: 'scene',
        metadata: { tags: ['test'] },
      });

      const result = await useGoalStore.getState().processSegmentForGoals(segmentId, characterId);

      // Should reject invalid goal
      expect(result.newGoalsCreated).toBe(0);
      const goals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(goals).toHaveLength(0);
    });
  });
});