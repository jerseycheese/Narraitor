// src/components/Narrative/__tests__/useEndingDetection.openThreats.test.ts
//
// Covers the open-threat gate: a lull is not a resolution. When major events
// are on record, the ending offer waits until the model reports them settled.

import { renderHook } from '@testing-library/react';
import { useEndingDetection } from '../useEndingDetection';
import { getTimestamp } from '@/lib/utils/timestamp';
import type { NarrativeSegment } from '@/types/narrative.types';

const mockGenerateContent = jest.fn();
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({ generateContent: mockGenerateContent }),
}));

const segment = (
  id: string,
  metadata: Partial<NarrativeSegment['metadata']> = {}
): NarrativeSegment => ({
  id,
  content: `Segment ${id} content.`,
  type: 'scene',
  timestamp: new Date(),
  sessionId: 'test-session',
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
  metadata: { tags: [], ...metadata },
});

const renderDetection = (segments: NarrativeSegment[]) => {
  const onEndingSuggested = jest.fn();
  const { result } = renderHook(() =>
    useEndingDetection({
      sessionId: 'test-session',
      worldId: 'test-world',
      segments,
      onEndingSuggested,
    })
  );
  return { result, onEndingSuggested };
};

/** The turn-30 barricade case: calm room, threat still outside. */
const barricadeStory = () => [
  segment('1'),
  segment('2', { majorEvent: 'A shape moves in the woods beyond the treeline' }),
  segment('3', { majorEvent: 'A distress call from the other camp goes unanswered' }),
  segment('4'),
];

const endingOffer = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    suggestEnding: true,
    confidence: 'high',
    endingType: 'story-complete',
    reason:
      'The immediate threat has been averted and the characters are secured in a safe location.',
    ...extra,
  });

describe('useEndingDetection open-threat gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('holds the offer back when the model reports an unresolved threat', async () => {
    mockGenerateContent.mockResolvedValue({
      content: endingOffer({
        unresolvedThreats: ['The shape in the woods was never dealt with'],
      }),
    });
    const { result, onEndingSuggested } = renderDetection(barricadeStory());

    await result.current.checkForEndingIndicators(
      segment('5', { majorEvent: 'The kitchen door is barred from the inside' })
    );

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('holds the offer back when the model skips the threat census entirely', async () => {
    // No census with major events on record means the calm went unweighed.
    mockGenerateContent.mockResolvedValue({ content: endingOffer() });
    const { result, onEndingSuggested } = renderDetection(barricadeStory());

    await result.current.checkForEndingIndicators(
      segment('5', { majorEvent: 'The kitchen door is barred from the inside' })
    );

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('offers the ending once the model reports the threats settled', async () => {
    mockGenerateContent.mockResolvedValue({
      content: endingOffer({ unresolvedThreats: [] }),
    });
    const { result, onEndingSuggested } = renderDetection(barricadeStory());

    await result.current.checkForEndingIndicators(
      segment('5', { majorEvent: 'The thing in the woods is put down for good' })
    );

    expect(onEndingSuggested).toHaveBeenCalledWith(
      expect.any(String),
      'story-complete'
    );
  });

  it('leaves stories with no major events on record alone', async () => {
    // Nothing to weigh the calm against, so the gate must not block anything.
    mockGenerateContent.mockResolvedValue({ content: endingOffer() });
    const { result, onEndingSuggested } = renderDetection([
      segment('1'),
      segment('2'),
    ]);

    await result.current.checkForEndingIndicators(segment('3'));

    expect(onEndingSuggested).toHaveBeenCalledWith(
      expect.any(String),
      'story-complete'
    );
  });

  it('keeps protecting a threat that has scrolled out of the recent window', async () => {
    // The only major event sits at segment 1, eight turns back and well outside
    // RECENT_SEGMENT_WINDOW. Nothing in the recent window carries one, so a
    // windowed collection would find no threads and switch the guard off for
    // exactly the threat that has been ignored longest. 9 segments total keeps
    // the routine check on its interval without a major event to force it.
    mockGenerateContent.mockResolvedValue({
      content: endingOffer({
        unresolvedThreats: ['The pursuer was never shaken off'],
      }),
    });
    const { result, onEndingSuggested } = renderDetection([
      segment('1', { majorEvent: 'A pursuer picks up the trail out of town' }),
      segment('2'),
      segment('3'),
      segment('4'),
      segment('5'),
      segment('6'),
      segment('7'),
      segment('8'),
    ]);

    await result.current.checkForEndingIndicators(segment('9'));

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('treats a malformed census as unanswered rather than all clear', async () => {
    mockGenerateContent.mockResolvedValue({
      content: endingOffer({ unresolvedThreats: [{ threat: 'the pursuer' }] }),
    });
    const { result, onEndingSuggested } = renderDetection(barricadeStory());

    await result.current.checkForEndingIndicators(
      segment('5', { majorEvent: 'The kitchen door is barred from the inside' })
    );

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('puts the open threads in the prompt so the model can weigh them', async () => {
    mockGenerateContent.mockResolvedValue({
      content: endingOffer({ unresolvedThreats: [] }),
    });
    const { result } = renderDetection(barricadeStory());

    await result.current.checkForEndingIndicators(
      segment('5', { majorEvent: 'The kitchen door is barred from the inside' })
    );

    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('A shape moves in the woods beyond the treeline');
    expect(prompt).toContain('unresolvedThreats');
  });
});
