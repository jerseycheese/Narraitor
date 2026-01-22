import React from 'react';
import { renderHook, act } from '@testing-library/react';
import type { Decision } from '@/types/narrative.types';
import { useActiveGameSessionEffects } from './useActiveGameSessionEffects';

describe('useActiveGameSessionEffects', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a fallback decision when choice generation stalls', () => {
    const { result } = renderHook(() => {
      const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
      const [isGenerating, setIsGenerating] = React.useState(false);
      const [initialized, setInitialized] = React.useState(false);
      const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(true);
      const choiceGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

      const { scheduleChoiceFallback } = useActiveGameSessionEffects({
        sessionId: 'session-1',
        worldId: 'world-1',
        controllerKey: 'controller-1',
        initialized,
        isGenerating,
        segmentCount: 0,
        characterId: undefined,
        onEnd: undefined,
        onEndStoryClick: jest.fn(),
        setIsGenerating,
        setInitialized,
        setCurrentDecision,
        setIsGeneratingChoices,
        choiceGenerationTimeoutRef,
      });

      return {
        currentDecision,
        isGeneratingChoices,
        scheduleChoiceFallback,
      };
    });

    act(() => {
      result.current.scheduleChoiceFallback();
      jest.advanceTimersByTime(15000);
    });

    expect(result.current.currentDecision?.prompt).toBe('What will you do?');
    expect(result.current.isGeneratingChoices).toBe(false);
  });
});
