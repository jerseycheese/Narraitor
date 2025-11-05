/**
 * Situation Analysis Tests for NarrativeContextExtractor
 *
 * Tests the logic that analyzes narrative content to identify the current situation
 * for PlayerDecisionTracker integration (Issue #142).
 *
 * Focus: Situation identification from narrative content
 */

import {
  TEST_SESSION_ID,
  createMerchantSegment,
  createCombatSegment,
  createVillageSegment,
  createWildernessSegment,
  createUnclearSegment,
  createSegment,
  extractDecisionContext
} from './narrativeContextExtractor.testHelpers';

describe('Narrative Context Extraction - Situation', () => {
  describe('Situation Analysis', () => {
    it('should identify merchant interaction situations', () => {
      const segments = [
        createMerchantSegment('seg-1'),
        createSegment({
          id: 'seg-2',
          content: 'He tells you about his stolen goods.',
          type: 'dialogue',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['information']
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.situation).toBe('merchant interaction');
    });

    it('should identify combat encounter situations', () => {
      const segments = [
        createCombatSegment('seg-1'),
        createSegment({
          id: 'seg-2',
          content: 'They draw their weapons and prepare to fight.',
          type: 'action',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['threat']
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.situation).toBe('combat encounter');
    });

    it('should identify settlement visit situations', () => {
      const segments = [
        createVillageSegment('seg-1'),
        createSegment({
          id: 'seg-2',
          content: 'The villagers eye you curiously.',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['social']
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.situation).toBe('settlement visit');
    });

    it('should identify wilderness exploration situations', () => {
      const segments = [createWildernessSegment('seg-1')];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.situation).toBe('wilderness exploration');
    });

    it('should handle unclear situations gracefully', () => {
      const segments = [createUnclearSegment('seg-1')];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.situation).toBeUndefined();
    });
  });
});
