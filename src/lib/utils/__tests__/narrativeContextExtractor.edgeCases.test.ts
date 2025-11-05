/**
 * Edge Cases and Robustness Tests for NarrativeContextExtractor
 *
 * Tests the logic that handles edge cases and unusual inputs when extracting
 * narrative context for PlayerDecisionTracker integration (Issue #142).
 *
 * Focus: Robustness, consistency, and handling of malformed data
 */

import {
  TEST_SESSION_ID,
  TEST_CHARACTER_IDS,
  createSequentialSegments,
  createEmptyContentSegment,
  createCharacterSegment,
  extractDecisionContext
} from './narrativeContextExtractor.testHelpers';

describe('Narrative Context Extraction - Edge Cases', () => {
  describe('Edge Cases and Robustness', () => {
    it('should handle empty segment list', () => {
      const context = extractDecisionContext([], TEST_SESSION_ID);

      expect(context).toEqual({});
    });

    it('should focus on recent segments for context', () => {
      // Create many segments to test that only recent ones are considered
      const segments = createSequentialSegments(10);

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      // Should use the most recent location
      expect(context.location).toBe('Final Location');
    });

    it('should handle malformed segment data gracefully', () => {
      const segments = [createEmptyContentSegment('seg-1')];

      expect(() => {
        extractDecisionContext(segments, TEST_SESSION_ID);
      }).not.toThrow();
    });

    it('should maintain consistent results for identical inputs', () => {
      const segments = [
        createCharacterSegment(
          'seg-1',
          'A merchant greets you in the marketplace.',
          [TEST_CHARACTER_IDS.merchant]
        )
      ];

      // Add location to the first segment
      segments[0].metadata = {
        ...segments[0].metadata,
        location: 'Town Marketplace'
      };

      // Call multiple times with same input
      const results = Array(5).fill(null).map(() =>
        extractDecisionContext(segments, TEST_SESSION_ID, TEST_CHARACTER_IDS.player)
      );

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });
  });
});
