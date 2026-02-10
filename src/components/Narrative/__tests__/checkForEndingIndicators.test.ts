// src/components/Narrative/__tests__/checkForEndingIndicators.test.ts

import type { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { createMockCheckForEndingIndicators, createMockAIResponse } from './fixtures/endingDetectionMocks';

// Mock the AI client
const mockGenerateContent = jest.fn();
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({
    generateContent: mockGenerateContent
  })
}));

// Test helpers
const createSegment = (id: string, content: string): NarrativeSegment => ({
  id,
  content,
  type: 'scene',
  timestamp: new Date(),
  sessionId: 'test-session',
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
  metadata: { tags: [] }
});

const createStandardSegments = () => [
  createSegment('1', 'The hero begins their journey to save the kingdom.'),
  createSegment('2', 'They meet a wise old mentor who gives them a magical sword.'),
  createSegment('3', 'The hero faces their first challenge against dark forces.')
];

describe('Pure AI Ending Detection', () => {
  const mockOnEndingSuggested = jest.fn();
  let checkForEndingIndicators: ReturnType<typeof createMockCheckForEndingIndicators>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkForEndingIndicators = createMockCheckForEndingIndicators();
  });

  describe('AI Analysis Without Keywords', () => {
    it('should suggest ending when AI detects natural story conclusion', async () => {
      const reason =
        'The central conflict has been resolved with the villain defeated. The hero has achieved their goal and the kingdom is saved. This feels like a natural and satisfying conclusion point.';
      mockGenerateContent.mockResolvedValueOnce(createMockAIResponse({ reason }));

      const existingSegments = createStandardSegments();
      const conclusiveSegment = createSegment(
        '4',
        'With the dark sorcerer finally defeated, the hero stood victorious. The kingdom was saved, and peace returned to the land. The hero looked back on their incredible journey with satisfaction, knowing they had fulfilled their destiny.'
      );

      await checkForEndingIndicators(existingSegments, conclusiveSegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('You are a narrative expert analyzing a story in progress')
      );
      expect(mockOnEndingSuggested).toHaveBeenCalledWith(reason, 'story-complete');
    });

    it('should NOT suggest ending when AI detects ongoing story', async () => {
      mockGenerateContent.mockResolvedValueOnce(
        createMockAIResponse({
          suggestEnding: false,
          endingType: 'none',
          reason: 'The hero has gained new allies but the main quest is still unresolved. There are clear plot threads that need continuation.'
        })
      );

      const ongoingSegment = createSegment(
        '4',
        'The hero discovers a new ally who reveals crucial information about the enemy. Together, they plan their next move toward the final confrontation that still lies ahead.'
      );

      await checkForEndingIndicators(createStandardSegments(), ongoingSegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });

    it('should reject low confidence AI suggestions', async () => {
      mockGenerateContent.mockResolvedValueOnce(
        createMockAIResponse({ confidence: 'low', reason: 'Might be an ending but unclear' })
      );

      const ambiguousSegment = createSegment('4', 'The hero pauses to rest and reflect on their journey so far.');

      await checkForEndingIndicators(createStandardSegments(), ambiguousSegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });
  });

  describe('No Keyword Dependency', () => {
    it('should detect endings without traditional ending words', async () => {
      const reason =
        'The character has achieved personal growth and found their place in the world. The emotional arc feels complete even though no explicit ending words were used.';
      mockGenerateContent.mockResolvedValueOnce(
        createMockAIResponse({ confidence: 'medium', endingType: 'character-retirement', reason })
      );

      const existingSegments = [
        createSegment('1', 'A young woman leaves her village, feeling lost and purposeless.'),
        createSegment('2', 'She faces hardships that test her resolve and identity.'),
        createSegment('3', 'Through trials, she discovers her true strengths and values.')
      ];

      const subtleEndingSegment = createSegment(
        '4',
        'She smiled as she watched the sunrise paint the mountains gold. For the first time in years, she felt truly at home. The young woman who had left this village was gone, replaced by someone who understood what really mattered.'
      );

      await checkForEndingIndicators(existingSegments, subtleEndingSegment, mockOnEndingSuggested);

      expect(mockOnEndingSuggested).toHaveBeenCalledWith(reason, 'character-retirement');
    });

    it('should NOT be fooled by ending keywords in non-conclusive context', async () => {
      // Mock AI correctly identifies false positive
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: false,
          confidence: 'high',
          endingType: 'none',
          reason: 'Although the text contains words like "quest complete", this is clearly referring to a minor task within a larger ongoing adventure. The main story arc is far from resolved.'
        })
      });

      const existingSegments = [
        createSegment('1', 'The hero begins an epic journey to defeat the dark lord.'),
        createSegment('2', 'They must gather allies and powerful artifacts.'),
        createSegment('3', 'The first artifact is located in a merchant town.')
      ];

      // Contains ending keywords but NOT actually an ending
      const fakeEndingSegment = createSegment('4',
        'The merchant smiled as the hero returned. "Quest complete!" he said, handing over the reward. "But beware, young one, for greater challenges await. The real adventure is just beginning, and the dark lord grows stronger each day."'
      );

      await checkForEndingIndicators(existingSegments, fakeEndingSegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();
      // Should NOT suggest ending despite keywords
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI failure gracefully with no fallback', async () => {
      // Mock AI failure
      mockGenerateContent.mockRejectedValueOnce(new Error('AI service unavailable'));

      // Suppress console.error for this test since it's expected
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const existingSegments = [
        createSegment('1', 'Story begins.'),
        createSegment('2', 'Story continues.'),
        createSegment('3', 'Story develops.')
      ];

      const anySegment = createSegment('4', 'Any content should not trigger ending when AI fails.');

      await checkForEndingIndicators(existingSegments, anySegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();
      // Should NOT suggest ending when AI fails (pure AI approach)
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle malformed AI response gracefully', async () => {
      // Mock malformed JSON response
      mockGenerateContent.mockResolvedValueOnce({
        content: 'Invalid JSON response from AI'
      });

      // Suppress console.error for this test since it's expected
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const existingSegments = [
        createSegment('1', 'Story begins.'),
        createSegment('2', 'Story continues.'),
        createSegment('3', 'Story develops.')
      ];

      const anySegment = createSegment('4', 'Content that would normally trigger ending analysis.');

      await checkForEndingIndicators(existingSegments, anySegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();
      // Should NOT suggest ending when JSON parsing fails
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('Context Requirements', () => {
    it('should skip analysis with insufficient narrative context', async () => {
      const minimalSegments = [createSegment('1', 'Short story.')];
      const newSegment = createSegment('2', 'Even conclusive content should not trigger with too few segments.');

      await checkForEndingIndicators(minimalSegments, newSegment, mockOnEndingSuggested);

      // Should NOT call AI or suggest ending with insufficient context
      expect(mockGenerateContent).not.toHaveBeenCalled();
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });

    it('should provide comprehensive context to AI for longer narratives', async () => {
      // Mock response to complete the test
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: false,
          confidence: 'high',
          endingType: 'none',
          reason: 'Story continues'
        })
      });

      // Create many segments to test context building
      const manySegments = Array.from({ length: 12 }, (_, i) => 
        createSegment(String(i + 1), `Story segment ${i + 1} with narrative content.`)
      );
      
      const newSegment = createSegment('13', 'Latest narrative development.');

      await checkForEndingIndicators(manySegments, newSegment, mockOnEndingSuggested);

      expect(mockGenerateContent).toHaveBeenCalled();

      // Verify that the prompt includes both recent context and earlier story summary
      const promptCall = mockGenerateContent.mock.calls[0][0];
      expect(promptCall).toContain('Earlier story:');
      expect(promptCall).toContain('Recent narrative developments:');
      expect(promptCall).toContain('Segment 1:');
      expect(promptCall).toContain('Segment 5:'); // Recent segments
    });
  });

  describe('Ending Type Classification', () => {
    const endingTypes = [
      {
        type: 'story-complete',
        scenario: 'main quest resolution',
        reason: 'The primary conflict has been resolved and the world is saved.'
      },
      {
        type: 'character-retirement', 
        scenario: 'personal journey completion',
        reason: 'The character has completed their personal growth and found peace.'
      },
      {
        type: 'session-limit',
        scenario: 'natural stopping point',
        reason: 'This represents a good place to pause this adventure.'
      }
    ];

    endingTypes.forEach(({ type, scenario, reason }) => {
      it(`should correctly identify ${type} ending type`, async () => {
        mockGenerateContent.mockResolvedValueOnce({
          content: JSON.stringify({
            suggestEnding: true,
            confidence: 'high',
            endingType: type,
            reason: reason
          })
        });

        const existingSegments = [
          createSegment('1', 'Story begins.'),
          createSegment('2', 'Story develops.'),
          createSegment('3', 'Story continues.')
        ];

        const testSegment = createSegment('4', `Content representing ${scenario}.`);

        await checkForEndingIndicators(existingSegments, testSegment, mockOnEndingSuggested);

        expect(mockOnEndingSuggested).toHaveBeenCalledWith(reason, type);
      });
    });
  });
});