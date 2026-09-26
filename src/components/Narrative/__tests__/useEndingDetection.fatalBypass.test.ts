import { renderHook, act } from '@testing-library/react';
import { useEndingDetection } from '../useEndingDetection';
import type { NarrativeSegment } from '@/types/narrative.types';

const mockGenerateContent = jest.fn();
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({ generateContent: mockGenerateContent }),
}));

const makeSegment = (id: string): NarrativeSegment => ({
  id,
  content: `Segment ${id} content.`,
  type: 'scene',
  timestamp: new Date(),
  sessionId: 'test-session',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: { tags: [] },
});

describe('useEndingDetection - fatal ending bypasses prior suggestion ref (#2168)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a fatal ending to fire onEndingSuggested even after a prior soft offer was suggested', () => {
    const onEndingSuggested = jest.fn();
    const { result } = renderHook(() =>
      useEndingDetection({
        sessionId: 'test-session',
        worldId: 'test-world',
        segments: [makeSegment('1')],
        onEndingSuggested,
      })
    );

    // 1. Initial soft offer fires
    act(() => {
      result.current.suggestEnding('Your story could end here.', 'story-complete');
    });

    expect(onEndingSuggested).toHaveBeenCalledTimes(1);
    expect(onEndingSuggested).toHaveBeenCalledWith(
      'Your story could end here.',
      'story-complete'
    );

    // 2. A second non-fatal offer is suppressed by endingSuggestedRef
    act(() => {
      result.current.suggestEnding('Another soft ending point.', 'story-complete');
    });

    expect(onEndingSuggested).toHaveBeenCalledTimes(1);

    // 3. A subsequent fatal ending MUST NOT be suppressed
    act(() => {
      result.current.suggestEnding(
        'fatal: narrative segment marked the player as dead or incapacitated.',
        'story-complete'
      );
    });

    expect(onEndingSuggested).toHaveBeenCalledTimes(2);
    expect(onEndingSuggested).toHaveBeenLastCalledWith(
      'fatal: narrative segment marked the player as dead or incapacitated.',
      'story-complete'
    );
  });
});
