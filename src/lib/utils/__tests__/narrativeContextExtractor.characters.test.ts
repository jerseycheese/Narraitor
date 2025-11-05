/**
 * Character Presence Detection Tests for NarrativeContextExtractor
 *
 * Tests the logic that extracts character presence information from narrative segments
 * for PlayerDecisionTracker integration (Issue #142).
 *
 * Focus: Character ID extraction and deduplication
 */

import {
  TEST_SESSION_ID,
  TEST_CHARACTER_IDS,
  createCharacterSegment,
  createSegment,
  extractDecisionContext
} from './narrativeContextExtractor.testHelpers';

describe('Narrative Context Extraction - Characters', () => {
  describe('Character Presence Detection', () => {
    it('should extract characters present from segment metadata', () => {
      const segments = [
        createCharacterSegment(
          'seg-1',
          'The merchant and his guard approach.',
          [TEST_CHARACTER_IDS.merchant, TEST_CHARACTER_IDS.guard, TEST_CHARACTER_IDS.player]
        ),
        createCharacterSegment(
          'seg-2',
          'A suspicious figure watches from the shadows.',
          [TEST_CHARACTER_IDS.spy, TEST_CHARACTER_IDS.player],
          '2024-01-01T12:01:00Z'
        )
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID, TEST_CHARACTER_IDS.player);

      // Should include all characters except the player character
      expect(context.charactersPresent).toEqual(
        expect.arrayContaining([TEST_CHARACTER_IDS.merchant, TEST_CHARACTER_IDS.guard, TEST_CHARACTER_IDS.spy])
      );
      expect(context.charactersPresent).not.toContain(TEST_CHARACTER_IDS.player);
    });

    it('should handle duplicate character IDs correctly', () => {
      const segments = [
        createCharacterSegment(
          'seg-1',
          'The merchant speaks.',
          [TEST_CHARACTER_IDS.merchant, TEST_CHARACTER_IDS.player]
        ),
        createCharacterSegment(
          'seg-2',
          'The merchant continues speaking.',
          [TEST_CHARACTER_IDS.merchant, TEST_CHARACTER_IDS.player], // Same characters again
          '2024-01-01T12:01:00Z'
        )
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID, TEST_CHARACTER_IDS.player);

      // Should deduplicate character IDs
      expect(context.charactersPresent).toEqual([TEST_CHARACTER_IDS.merchant]);
      expect(context.charactersPresent).toHaveLength(1);
    });

    it('should return undefined for charactersPresent when no other characters exist', () => {
      const segments = [
        createCharacterSegment(
          'seg-1',
          'You walk alone through the empty corridor.',
          [TEST_CHARACTER_IDS.player] // Only the player
        )
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID, TEST_CHARACTER_IDS.player);

      expect(context.charactersPresent).toBeUndefined();
    });

    it('should handle segments without characterIds', () => {
      const segments = [
        createSegment({
          id: 'seg-1',
          content: 'The wind blows through the trees.',
          // No characterIds
          metadata: {
            tags: ['atmosphere']
          }
        })
      ];

      const context = extractDecisionContext(segments, TEST_SESSION_ID);

      expect(context.charactersPresent).toBeUndefined();
    });
  });
});
