// src/components/Narrative/__tests__/NarrativeController.aiEndingDetection.test.tsx

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { NarrativeSegment } from '@/types/narrative.types';

// Mock the AI client
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({
    generateContent: jest.fn()
  })
}));

// Mock the narrative store
jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: jest.fn()
}));

// Mock the narrative generator
jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateContinuation: jest.fn()
  }))
}));

// Mock the NarrativeHistory component to avoid DOM issues in tests
jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: ({ segments }: { segments: { content: string }[] }) => (
    <div data-testid="narrative-history">
      {segments.map((segment, index) => (
        <div key={index} data-testid={`segment-${index}`}>
          {segment.content}
        </div>
      ))}
    </div>
  )
}));

import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

describe('NarrativeController - Pure AI Ending Detection', () => {
  const mockOnEndingSuggested = jest.fn();
  const mockAddSegment = jest.fn();
  const mockGetSessionSegments = jest.fn();
  const mockAIClient = createDefaultGeminiClient() as jest.Mocked<ReturnType<typeof createDefaultGeminiClient>>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup narrative store mock
    (useNarrativeStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        addSegment: mockAddSegment,
        getSessionSegments: mockGetSessionSegments
      };
      return selector(state);
    });

    // Setup default segments - starts with enough segments for AI analysis
    mockGetSessionSegments.mockReturnValue([
      { id: '1', content: 'The hero begins their journey to save the kingdom.', type: 'scene' },
      { id: '2', content: 'They meet a wise old mentor who gives them a magical sword.', type: 'scene' },
      { id: '3', content: 'The hero faces their first challenge against dark forces.', type: 'scene' }
    ]);
  });

  describe('Pure AI Analysis (No Keywords)', () => {
    it('should suggest ending when AI detects natural story conclusion', async () => {
      // Mock AI response for conclusive story
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: true,
          confidence: 'high',
          endingType: 'story-complete',
          reason: 'The central conflict has been resolved with the villain defeated. The hero has achieved their goal and the kingdom is saved. This feels like a natural and satisfying conclusion point.'
        })
      });

      const { rerender } = render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      // Add a conclusive narrative segment
      const conclusiveSegment: NarrativeSegment = {
        id: '4',
        content: 'With the dark sorcerer finally defeated, the hero stood victorious. The kingdom was saved, and peace returned to the land. The hero looked back on their incredible journey with satisfaction, knowing they had fulfilled their destiny.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      // Trigger ending detection by adding the segment
      await act(async () => {
        mockAddSegment(conclusiveSegment);
        // Trigger rerender to simulate the new segment being processed
        rerender(
          <NarrativeController
            worldId="test-world"
            sessionId="test-session"
            onEndingSuggested={mockOnEndingSuggested}
            triggerGeneration={false}
          />
        );
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalledWith(
          expect.stringContaining('You are a narrative expert analyzing a story in progress')
        );
      });

      expect(mockOnEndingSuggested).toHaveBeenCalledWith(
        'The central conflict has been resolved with the villain defeated. The hero has achieved their goal and the kingdom is saved. This feels like a natural and satisfying conclusion point.',
        'story-complete'
      );
    });

    it('should NOT suggest ending when AI detects ongoing story', async () => {
      // Mock AI response for ongoing story
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: false,
          confidence: 'high',
          endingType: 'none',
          reason: 'The hero has gained new allies but the main quest is still unresolved. There are clear plot threads that need continuation.'
        })
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      // Add a mid-story segment that should NOT trigger ending
      const ongoingSegment: NarrativeSegment = {
        id: '4',
        content: 'The hero discovers a new ally who reveals crucial information about the enemy. Together, they plan their next move toward the final confrontation that still lies ahead.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(ongoingSegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Should NOT suggest ending
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });

    it('should handle AI confidence levels correctly', async () => {
      // Test with low confidence - should NOT suggest ending
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: true,
          confidence: 'low',
          endingType: 'story-complete',
          reason: 'Might be an ending but unclear'
        })
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      const ambiguousSegment: NarrativeSegment = {
        id: '4',
        content: 'The hero pauses to rest and reflect on their journey so far.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(ambiguousSegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Should NOT suggest ending due to low confidence
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });
  });

  describe('No Keyword Dependency', () => {
    it('should suggest ending without traditional "ending words"', async () => {
      // Mock AI response that recognizes conclusion without keywords
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: true,
          confidence: 'medium',
          endingType: 'character-retirement',
          reason: 'The character has achieved personal growth and found their place in the world. The emotional arc feels complete even though no explicit ending words were used.'
        })
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      // Segment with NO traditional ending keywords but emotionally conclusive
      const subtleEndingSegment: NarrativeSegment = {
        id: '4',
        content: 'She smiled as she watched the sunrise paint the mountains gold. For the first time in years, she felt truly at home. The young woman who had left this village was gone, replaced by someone who understood what really mattered.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(subtleEndingSegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      expect(mockOnEndingSuggested).toHaveBeenCalledWith(
        'The character has achieved personal growth and found their place in the world. The emotional arc feels complete even though no explicit ending words were used.',
        'character-retirement'
      );
    });

    it('should NOT be fooled by ending keywords in non-conclusive context', async () => {
      // Mock AI response that correctly identifies false positive
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: false,
          confidence: 'high',
          endingType: 'none',
          reason: 'Although the text contains words like "quest complete", this is clearly referring to a minor task within a larger ongoing adventure. The main story arc is far from resolved.'
        })
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      // Segment with ending keywords but NOT actually an ending
      const fakeEndingSegment: NarrativeSegment = {
        id: '4',
        content: 'The merchant smiled as the hero returned. "Quest complete!" he said, handing over the reward. "But beware, young one, for greater challenges await. The real adventure is just beginning, and the dark lord grows stronger each day."',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(fakeEndingSegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Should NOT suggest ending despite keywords
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI failure gracefully with no fallback', async () => {
      // Mock AI failure
      mockAIClient.generateContent.mockRejectedValueOnce(new Error('AI service unavailable'));

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      const anySegment: NarrativeSegment = {
        id: '4',
        content: 'Any content should not trigger ending when AI fails.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(anySegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Should NOT suggest ending when AI fails (pure AI approach)
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });

    it('should handle malformed AI response gracefully', async () => {
      // Mock malformed JSON response
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: 'Invalid JSON response from AI'
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      const anySegment: NarrativeSegment = {
        id: '4',
        content: 'Content that would normally trigger ending analysis.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(anySegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Should NOT suggest ending when JSON parsing fails
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });
  });

  describe('Context Requirements', () => {
    it('should skip analysis with insufficient narrative context', async () => {
      // Setup with minimal segments (less than 3)
      mockGetSessionSegments.mockReturnValue([
        { id: '1', content: 'Short story.', type: 'scene' }
      ]);

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      const newSegment: NarrativeSegment = {
        id: '2',
        content: 'Even conclusive content should not trigger with too few segments.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(newSegment);
      });

      // Should NOT call AI or suggest ending with insufficient context
      expect(mockAIClient.generateContent).not.toHaveBeenCalled();
      expect(mockOnEndingSuggested).not.toHaveBeenCalled();
    });

    it('should provide full story context to AI for longer narratives', async () => {
      // Setup with many segments to test context building
      const manySegments = Array.from({ length: 12 }, (_, i) => ({
        id: String(i + 1),
        content: `Story segment ${i + 1} with narrative content.`,
        type: 'scene' as const
      }));
      
      mockGetSessionSegments.mockReturnValue(manySegments);

      mockAIClient.generateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          suggestEnding: false,
          confidence: 'high',
          endingType: 'none',
          reason: 'Story continues'
        })
      });

      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      const newSegment: NarrativeSegment = {
        id: '13',
        content: 'Latest narrative development.',
        type: 'scene',
        timestamp: new Date(),
        sessionId: 'test-session',
        metadata: {}
      };

      await act(async () => {
        mockAddSegment(newSegment);
      });

      await waitFor(() => {
        expect(mockAIClient.generateContent).toHaveBeenCalled();
      });

      // Verify that the prompt includes both recent context and earlier story summary
      const promptCall = mockAIClient.generateContent.mock.calls[0][0];
      expect(promptCall).toContain('Earlier story:');
      expect(promptCall).toContain('Recent narrative developments:');
      expect(promptCall).toContain('Segment 1:');
      expect(promptCall).toContain('Segment 5:'); // Recent segments
    });
  });

  describe('Ending Type Detection', () => {
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
        mockAIClient.generateContent.mockResolvedValueOnce({
          content: JSON.stringify({
            suggestEnding: true,
            confidence: 'high',
            endingType: type,
            reason: reason
          })
        });

        render(
          <NarrativeController
            worldId="test-world"
            sessionId="test-session"
            onEndingSuggested={mockOnEndingSuggested}
            triggerGeneration={false}
          />
        );

        const testSegment: NarrativeSegment = {
          id: '4',
          content: `Content representing ${scenario}.`,
          type: 'scene',
          timestamp: new Date(),
          sessionId: 'test-session',
          metadata: {}
        };

        await act(async () => {
          mockAddSegment(testSegment);
        });

        await waitFor(() => {
          expect(mockOnEndingSuggested).toHaveBeenCalledWith(reason, type);
        });
      });
    });
  });
});