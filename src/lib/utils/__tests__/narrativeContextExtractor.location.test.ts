/**
 * Location Extraction Tests for NarrativeContextExtractor
 *
 * Tests the logic that extracts location information from narrative segment metadata
 * for PlayerDecisionTracker integration (Issue #142).
 *
 * Focus: Location extraction accuracy from segment metadata
 */

import {
  TEST_SESSION_ID,
  createLocationSegment,
  createSegment,
  extractDecisionContext
} from './narrativeContextExtractor.testHelpers';

describe('Narrative Context Extraction - Location', () => {
  describe('Location Extraction', () => {
    it('should extract location from segment metadata', () => {
      const segments = [
        createLocationSegment('seg-1', 'You enter the bustling marketplace.', 'Rivertown Marketplace'),
        createSegment({
          id: 'seg-2',
          content: 'Merchants call out their wares.',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['atmosphere']
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.location).toBe('Rivertown Marketplace');
    });

    it('should use most recent location when multiple exist', () => {
      const segments = [
        createLocationSegment(
          'seg-1',
          'You leave the tavern.',
          'The Prancing Pony Tavern',
          '2024-01-01T12:00:00Z'
        ),
        createLocationSegment(
          'seg-2',
          'You arrive at the town square.',
          'Millhaven Town Square',
          '2024-01-01T12:02:00Z' // More recent
        )
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      // Should use the more recent location
      expect(context.location).toBe('Millhaven Town Square');
    });

    it('should handle segments without location metadata', () => {
      const segments = [
        createSegment({
          id: 'seg-1',
          content: 'You think about your next move.',
          metadata: {
            tags: ['introspection']
            // No location
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.location).toBeUndefined();
    });
  });
});
