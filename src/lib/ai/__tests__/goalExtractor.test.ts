// src/lib/ai/__tests__/test.ts

import { extractGoalsFromNarrative } from '../goalExtractor';
import { NarrativeGoal, GoalExtractionRequest } from '../../../types/goal.types';
import { getTimestamp } from '@/lib/utils/timestamp';

// Mock the AI client
jest.mock('../geminiClient', () => ({
  createGeminiClient: jest.fn(() => ({
    generateContent: jest.fn(),
  })),
}));

// The extractor caches its client, so wrap the factory once to record every
// prompt it sends; the recorded prompts prove what rode along.
const mockSentPrompts: string[] = [];
jest.mock('../defaultGeminiClient', () => {
  const actual = jest.requireActual('../defaultGeminiClient');
  return {
    ...actual,
    createDefaultGeminiClient: (...args: unknown[]) => {
      const client = actual.createDefaultGeminiClient(...args);
      const generateContent = client.generateContent.bind(client);
      client.generateContent = (prompt: string) => {
        mockSentPrompts.push(prompt);
        return generateContent(prompt);
      };
      return client;
    },
  };
});

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

      const result = await extractGoalsFromNarrative(request);

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

      const result = await extractGoalsFromNarrative(request);

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

      const result = await extractGoalsFromNarrative(request);

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

      const result = await extractGoalsFromNarrative(request);

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

      const result = await extractGoalsFromNarrative(request);

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

      const result = await extractGoalsFromNarrative(request);

      expect(result.newGoals).toHaveLength(2);
      
      const urgentGoal = result.newGoals.find((g) => g.title.toLowerCase().includes('sarah') || g.title.toLowerCase().includes('find'));
      const routineGoal = result.newGoals.find((g) => g.title.toLowerCase().includes('book') || g.title.toLowerCase().includes('library'));
      
      expect(urgentGoal?.priority).toBe('critical');
      expect(urgentGoal?.type).toBe('survival');
      expect(routineGoal?.priority).toBe('low');
    });
  });

  describe('world clock pass-through', () => {
    beforeEach(() => {
      mockSentPrompts.length = 0;
    });

    test('carries the ledger section out and the worldThreads block back', async () => {
      const request: GoalExtractionRequest = {
        content: 'You continue your quest',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        existingGoals: [],
        worldThreads: {
          currentTurn: 3,
          openThreads: [
            {
              id: 'thread-abc',
              sessionId: 'session-123',
              worldId: 'world-101',
              kind: 'actor',
              summary: 'The magistrate is riding for the capital',
              openedAtTurn: 1,
              lastAdvancedAtTurn: 1,
              status: 'open',
              notes: [],
              createdAt: getTimestamp(),
              updatedAt: getTimestamp(),
            },
          ],
        },
      };

      const result = await extractGoalsFromNarrative(request);

      expect(mockSentPrompts).toHaveLength(1);
      expect(mockSentPrompts[0]).toContain('WORLD CLOCK LEDGER');
      expect(mockSentPrompts[0]).toContain('[thread-abc]');
      expect(result.worldThreads).toEqual({
        opened: [],
        advanced: [{ id: 'thread-abc', note: expect.any(String) }],
        resolved: [],
      });
    });

    test('leaves the prompt and result untouched when no ledger is passed', async () => {
      const request: GoalExtractionRequest = {
        content: 'You continue your quest',
        sessionId: 'session-123',
        segmentId: 'segment-456',
        existingGoals: [],
      };

      const result = await extractGoalsFromNarrative(request);

      expect(mockSentPrompts).toHaveLength(1);
      expect(mockSentPrompts[0]).not.toContain('WORLD CLOCK LEDGER');
      expect(mockSentPrompts[0]).not.toContain('worldThreads');
      expect(result.worldThreads).toBeUndefined();
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

      const result = await extractGoalsFromNarrative(request);

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
      const result = await extractGoalsFromNarrative(request);

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

      // Should handle gracefully and not crash, returning empty arrays
      const result = await extractGoalsFromNarrative(request);

      expect(result.newGoals).toEqual([]);
      expect(result.updatedGoals).toEqual([]);
      expect(result.completedGoals).toEqual([]);
    });
  });
});
