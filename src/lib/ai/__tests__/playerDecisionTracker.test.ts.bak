/**
 * MVP-level tests for PlayerDecisionTracker
 * Focus on core functionality: tracking and analyzing player choice patterns
 */

import { PlayerDecisionTracker } from '../playerDecisionTracker';
import { ChoiceTypePreference } from '@/types/personalization.types';

describe('PlayerDecisionTracker - MVP Tests', () => {
  let tracker: PlayerDecisionTracker;

  beforeEach(() => {
    tracker = new PlayerDecisionTracker({
      storageKey: 'test_narraitor_decisions' // Use test storage key
    });
    tracker.clearDecisions(); // Start fresh for each test
  });

  describe('Core Decision Tracking', () => {

    test('retrieves decisions by session', () => {
      tracker.recordDecision('Test 1', 'Choice 1', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 2', 'Choice 2', 'diplomatic', 'session-2', 'world-1');
      
      const sessionDecisions = tracker.getSessionDecisions('session-1');
      
      expect(sessionDecisions).toHaveLength(1);
      expect(sessionDecisions[0].choiceType).toBe('helpful');
    });

    test('retrieves decisions by world', () => {
      tracker.recordDecision('Test 1', 'Choice 1', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 2', 'Choice 2', 'diplomatic', 'session-1', 'world-2');
      
      const worldDecisions = tracker.getWorldDecisions('world-1');
      
      expect(worldDecisions).toHaveLength(1);
      expect(worldDecisions[0].choiceType).toBe('helpful');
    });
  });

  describe('Choice Pattern Analysis', () => {
    test('identifies dominant choice types', () => {
      // Record multiple helpful decisions
      tracker.recordDecision('Test 1', 'Help', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 2', 'Assist', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 3', 'Aid', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 4', 'Negotiate', 'diplomatic', 'session-1', 'world-1');

      const analysis = tracker.analyzeChoicePatterns();

      expect(analysis.dominantChoiceTypes[0]).toBe('helpful');
      expect(analysis.choiceDistribution.helpful).toBe(3);
      expect(analysis.choiceDistribution.diplomatic).toBe(1);
    });

    test('calculates pattern strength', () => {
      // Record consistent choices
      tracker.recordDecision('Test 1', 'Help', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 2', 'Help', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 3', 'Help', 'helpful', 'session-1', 'world-1');

      const analysis = tracker.analyzeChoicePatterns();

      expect(analysis.patternStrength).toBeGreaterThan(50); // Strong pattern
    });

    test('handles mixed choice patterns', () => {
      const choiceTypes: ChoiceTypePreference[] = ['helpful', 'diplomatic', 'aggressive', 'stealthy'];
      
      choiceTypes.forEach((type, index) => {
        tracker.recordDecision(`Test ${index}`, `Choice ${index}`, type, 'session-1', 'world-1');
      });

      const analysis = tracker.analyzeChoicePatterns();

      expect(analysis.dominantChoiceTypes).toHaveLength(4);
      expect(analysis.patternStrength).toBeLessThan(50); // Weak pattern due to variety
    });
  });

  describe('MVP Acceptance Criteria', () => {
    test('supports narrative personalization by tracking preferences', () => {
      // Simulate player making consistent diplomatic choices
      tracker.recordDecision('Conflict 1', 'Negotiate', 'diplomatic', 'session-1', 'world-1');
      tracker.recordDecision('Conflict 2', 'Talk it out', 'diplomatic', 'session-1', 'world-1');
      tracker.recordDecision('Conflict 3', 'Find compromise', 'diplomatic', 'session-1', 'world-1');

      const recentDecisions = tracker.getRecentDecisions(7);
      const analysis = tracker.analyzeChoicePatterns(recentDecisions);

      // Should identify diplomatic preference
      expect(analysis.dominantChoiceTypes).toContain('diplomatic');
      expect(analysis.choiceDistribution.diplomatic).toBeGreaterThan(0);
      
      // This data can be used for narrative personalization
      expect(recentDecisions).toHaveLength(3);
      expect(recentDecisions.every(d => d.choiceType === 'diplomatic')).toBe(true);
    });

    test('preserves context for narrative continuity', () => {
      const decision = tracker.recordDecision(
        'You encounter a guard',
        'Show identification',
        'lawful',
        'session-1',
        'world-1',
        {
          location: 'Museum Entrance',
          situation: 'Trying to enter restricted area',
          charactersPresent: ['security guard', 'curator']
        }
      );

      expect(decision.context.location).toBe('Museum Entrance');
      expect(decision.context.situation).toBe('Trying to enter restricted area');
      expect(decision.context.charactersPresent).toContain('security guard');
    });
  });

  describe('Input Validation', () => {
    test('validates required fields', () => {
      expect(() => {
        tracker.recordDecision('', 'Valid choice', 'helpful', 'session-1', 'world-1');
      }).toThrow('Decision prompt is required');

      expect(() => {
        tracker.recordDecision('Valid prompt', '', 'helpful', 'session-1', 'world-1');
      }).toThrow('Choice text is required');

      expect(() => {
        tracker.recordDecision('Valid prompt', 'Valid choice', 'invalid' as ChoiceTypePreference, 'session-1', 'world-1');
      }).toThrow('Invalid choice type');
    });

    test('sanitizes malicious input', () => {
      const decision = tracker.recordDecision(
        'Prompt with <script>alert("xss")</script>',
        'Choice with "quotes" & symbols',
        'helpful',
        'session-1',
        'world-1',
        {
          location: 'Evil<script>location</script>',
          situation: 'Dangerous & "situation"',
          charactersPresent: ['Good character', 'Evil<script>char</script>', 'Normal & safe']
        }
      );

      expect(decision.prompt).not.toContain('<script>');
      expect(decision.choiceText).not.toContain('"');
      expect(decision.choiceText).not.toContain('&');
      expect(decision.context.location).not.toContain('<script>');
      expect(decision.context.situation).not.toContain('&');
      expect(decision.context.charactersPresent?.[1]).not.toContain('<script>');
      
      // Should still contain safe content
      expect(decision.prompt).toContain('Prompt with');
      expect(decision.choiceText).toContain('Choice with');
      expect(decision.context.location).toContain('Evil');
      expect(decision.context.charactersPresent).toContain('Good character');
    });

    test('limits input lengths', () => {
      const longString = 'a'.repeat(1000);
      
      const decision = tracker.recordDecision(
        longString,
        longString,
        'helpful',
        'session-1',
        'world-1'
      );

      expect(decision.prompt.length).toBeLessThanOrEqual(500);
      expect(decision.choiceText.length).toBeLessThanOrEqual(300);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty decision history', () => {
      const analysis = tracker.analyzeChoicePatterns();

      expect(analysis.dominantChoiceTypes).toHaveLength(0);
      expect(analysis.patternStrength).toBe(0);
      expect(Object.keys(analysis.choiceDistribution)).toHaveLength(0);
    });


    test('clears session decisions correctly', () => {
      tracker.recordDecision('Test 1', 'Choice 1', 'helpful', 'session-1', 'world-1');
      tracker.recordDecision('Test 2', 'Choice 2', 'helpful', 'session-2', 'world-1');

      tracker.clearSessionDecisions('session-1');

      expect(tracker.getSessionDecisions('session-1')).toHaveLength(0);
      expect(tracker.getSessionDecisions('session-2')).toHaveLength(1);
    });
  });
});