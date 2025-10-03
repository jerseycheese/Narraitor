// src/lib/ai/__tests__/goalExtractor.test.ts

import { goalExtractor } from '../goalExtractor';
import { NarrativeGoal, GoalExtractionRequest } from '../../../types/goal.types';
import { getTimestamp } from '@/lib/utils/timestamp';

// Mock the AI client
jest.mock('../geminiClient', () => ({
  createGeminiClient: jest.fn(() => ({
    generateContent: jest.fn(),
  })),
}));

describe('goalExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractGoalsFromNarrative', () => {
    test('should extract explicit goals from narrative content', async () => {
      const request: GoalExtractionRequest = {
        content: 'Sarah noticed a strange hole in the wall. "We need to investigate this," she said. "Something doesn\'t seem right about this place."',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        characterId: 'char-789',
        worldId: 'world-101',
        existingGoals: [],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(1);
      expect(result.newGoals[0].title).toContain('investigate');
      expect(result.newGoals[0].title.toLowerCase()).toContain('hole');
      expect(result.newGoals[0].type).toBe('exploration');
      expect(result.newGoals[0].priority).toBe('medium');
      expect(result.newGoals[0].status).toBe('active');
      expect(result.newGoals[0].description).toContain('hole in the wall');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should extract implicit goals from player actions', async () => {
      const request: GoalExtractionRequest = {
        content: 'You pick up the rusty key from the table and examine it closely. The key has strange markings that you\'ve never seen before.',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        characterId: 'char-789',
        existingGoals: [],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(1);
      expect(result.newGoals[0].title).toMatch(/key|find|unlock|door/i);
      expect(result.newGoals[0].type).toBe('quest');
      expect(result.newGoals[0].priority).toBe('medium');
      expect(result.newGoals[0].involvedCharacters).toContain('char-789');
      expect(result.newGoals[0].keywords).toContain('key');
    });

    test('should detect goal completion', async () => {
      const existingGoal: NarrativeGoal = {
        id: 'goal-123',
        sessionId: 'session-123',
        characterId: 'char-789',
        title: 'Find the missing key',
        description: 'Search for the key to unlock the door',
        type: 'quest',
        priority: 'high',
        status: 'active',
        mentionCount: 3,
        keywords: ['key', 'door', 'unlock'],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      const request: GoalExtractionRequest = {
        content: 'You insert the key into the lock and turn it slowly. The door creaks open, revealing a hidden chamber beyond.',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        characterId: 'char-789',
        existingGoals: [existingGoal],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.completedGoals).toContain('goal-123');
      expect(result.updatedGoals).toHaveLength(1);
      expect(result.updatedGoals[0].goalId).toBe('goal-123');
      expect(result.updatedGoals[0].updates.completionMethod).toBe('achieved');
    });

    test('should update existing goal progress', async () => {
      const existingGoal: NarrativeGoal = {
        id: 'goal-456',
        sessionId: 'session-123',
        characterId: 'char-789',
        title: 'Investigate the mysterious hole',
        description: 'Found a hole in the wall that needs investigation',
        type: 'exploration',
        priority: 'high',
        status: 'active',
        mentionCount: 1,
        keywords: ['hole', 'wall', 'investigate'],
        progressNotes: ['Discovered the hole'],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      const request: GoalExtractionRequest = {
        content: 'You peer into the hole and see a faint light flickering in the distance. The hole seems to lead to a tunnel system.',
        sessionId: 'session-123',
        segmentId: 'segment-789',
        characterId: 'char-789',
        existingGoals: [existingGoal],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.updatedGoals).toHaveLength(1);
      expect(result.updatedGoals[0].goalId).toBe('goal-456');
      expect(result.updatedGoals[0].updates.mentionCount).toBe(2);
      expect(result.updatedGoals[0].updates.progressNotes).toContain('light flickering');
      expect(result.updatedGoals[0].updates.lastMentionedAt).toBeDefined();
    });

    test('should handle multiple goals in complex narrative', async () => {
      const request: GoalExtractionRequest = {
        content: 'The merchant tells you about three tasks: find the stolen artifact, rescue his daughter from the bandits, and deliver a message to the neighboring village. "Complete all three and I\'ll reward you handsomely," he says.',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        characterId: 'char-789',
        existingGoals: [],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(3);
      
      const goalTitles = result.newGoals.map((g) => g.title.toLowerCase());
      expect(goalTitles.some((title: string) => title.includes('artifact'))).toBe(true);
      expect(goalTitles.some((title: string) => title.includes('daughter') || title.includes('rescue'))).toBe(true);
      expect(goalTitles.some((title: string) => title.includes('message') || title.includes('deliver'))).toBe(true);
      
      // All should be quest type since they're explicit tasks
      expect(result.newGoals.every((g) => g.type === 'quest')).toBe(true);
    });

    test('should prioritize goals based on narrative urgency', async () => {
      const request: GoalExtractionRequest = {
        content: 'The building is on fire! You need to find Sarah immediately before the smoke gets too thick. You also remember you were supposed to return the book to the library today.',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        characterId: 'char-789',
        existingGoals: [],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(2);
      
      const urgentGoal = result.newGoals.find((g) => g.title.toLowerCase().includes('sarah') || g.title.toLowerCase().includes('find'));
      const routineGoal = result.newGoals.find((g) => g.title.toLowerCase().includes('book') || g.title.toLowerCase().includes('library'));
      
      expect(urgentGoal?.priority).toBe('critical');
      expect(urgentGoal?.type).toBe('survival');
      expect(routineGoal?.priority).toBe('low');
    });
  });

  describe('detectGoalCompletion', () => {
    test('should detect completion through explicit success', async () => {
      const goal: NarrativeGoal = {
        id: 'goal-123',
        sessionId: 'session-123',
        title: 'Open the locked chest',
        description: 'Find a way to open the mysterious chest',
        type: 'quest',
        priority: 'medium',
        status: 'active',
        mentionCount: 2,
        keywords: ['chest', 'locked', 'open'],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      const narrativeContent = 'With a satisfying click, the chest opens to reveal a treasure trove of golden coins and precious gems.';

      const isComplete = await goalExtractor.detectGoalCompletion(goal, narrativeContent);

      expect(isComplete).toBe(true);
    });

    test('should detect abandonment through context change', async () => {
      const goal: NarrativeGoal = {
        id: 'goal-456',
        sessionId: 'session-123',
        title: 'Investigate the tavern',
        description: 'Check out the suspicious activity at the tavern',
        type: 'exploration',
        priority: 'medium',
        status: 'active',
        mentionCount: 1,
        keywords: ['tavern', 'investigate', 'suspicious'],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      const narrativeContent = 'The tavern burns down completely, leaving nothing but ashes and rubble. The fire department says it was an electrical fault.';

      const isComplete = await goalExtractor.detectGoalCompletion(goal, narrativeContent);

      expect(isComplete).toBe(true);
    });

    test('should not detect completion for ongoing goals', async () => {
      const goal: NarrativeGoal = {
        id: 'goal-789',
        sessionId: 'session-123',
        title: 'Learn magic spells',
        description: 'Study at the academy to become a better mage',
        type: 'quest',
        priority: 'low',
        status: 'active',
        mentionCount: 5,
        keywords: ['magic', 'spells', 'academy', 'study'],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      const narrativeContent = 'You practice your fire spell in the academy courtyard, managing to create a small flame that dances in your palm.';

      const isComplete = await goalExtractor.detectGoalCompletion(goal, narrativeContent);

      expect(isComplete).toBe(false);
    });
  });

  describe('buildGoalContext', () => {
    test('should build context for AI prompts', () => {
      const goals: NarrativeGoal[] = [
        {
          id: 'goal-1',
          sessionId: 'session-123',
          title: 'Find the ancient artifact',
          description: 'Search for the legendary artifact hidden in the temple',
          type: 'quest',
          priority: 'critical',
          status: 'active',
          mentionCount: 3,
          contextSummary: 'Player is searching for ancient artifact in temple',
          keywords: ['artifact', 'temple', 'ancient'],
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        },
        {
          id: 'goal-2',
          sessionId: 'session-123',
          title: 'Repair the broken bridge',
          description: 'Fix the bridge to cross the river safely',
          type: 'quest',
          priority: 'medium',
          status: 'active',
          mentionCount: 1,
          contextSummary: 'Player needs to repair bridge to continue journey',
          keywords: ['bridge', 'repair', 'river'],
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }
      ];

      const context = goalExtractor.buildGoalContext(goals, 500);

      expect(context.activeGoals).toHaveLength(2);
      expect(context.criticalGoals).toHaveLength(1);
      expect(context.criticalGoals[0].priority).toBe('critical');
      expect(context.contextText).toContain('ancient artifact');
      expect(context.contextText).toContain('repair bridge');
      expect(context.tokenCount).toBeLessThanOrEqual(500);
    });

    test('should prioritize critical goals in limited token budget', () => {
      const goals: NarrativeGoal[] = [
        {
          id: 'goal-critical',
          sessionId: 'session-123',
          title: 'Escape the collapsing building',
          description: 'Get out before the building falls',
          type: 'survival',
          priority: 'critical',
          status: 'active',
          mentionCount: 1,
          contextSummary: 'URGENT: Player must escape collapsing building immediately',
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        },
        {
          id: 'goal-low',
          sessionId: 'session-123',
          title: 'Buy groceries',
          description: 'Pick up some food from the market',
          type: 'social',
          priority: 'low',
          status: 'active',
          mentionCount: 1,
          contextSummary: 'Player needs to buy groceries when convenient',
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }
      ];

      const context = goalExtractor.buildGoalContext(goals, 50); // Very limited tokens

      expect(context.contextText).toContain('collapsing building');
      expect(context.contextText).not.toContain('groceries');
      expect(context.criticalGoals).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed narrative content', async () => {
      const request: GoalExtractionRequest = {
        content: '', // Empty content
        sessionId: 'session-123',
        segmentId: 'segment-456',
        existingGoals: [],
      };

      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(0);
      expect(result.updatedGoals).toHaveLength(0);
      expect(result.completedGoals).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    test('should handle AI service failures gracefully', async () => {
      // Mock AI failure
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const request: GoalExtractionRequest = {
        content: 'Some narrative content',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        existingGoals: [],
      };

      // This should not throw but return empty result
      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(0);
      expect(result.confidence).toBe(0);
      
      jest.restoreAllMocks();
    });

    test('should validate existing goals before processing', async () => {
      const malformedGoal = {
        id: 'goal-123',
        // Missing required fields
        sessionId: 'session-123',
      } as NarrativeGoal;

      const request: GoalExtractionRequest = {
        content: 'You continue your quest',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        existingGoals: [malformedGoal],
      };

      // Should handle gracefully and not crash
      const result = await goalExtractor.extractGoalsFromNarrative(request);

      expect(result).toBeDefined();
      expect(result.newGoals).toBeDefined();
      expect(result.updatedGoals).toBeDefined();
      expect(result.completedGoals).toBeDefined();
    });
  });
});