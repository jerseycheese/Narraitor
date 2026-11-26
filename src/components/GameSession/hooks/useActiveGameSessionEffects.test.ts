import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useActiveGameSessionEffects } from './useActiveGameSessionEffects';

describe('useActiveGameSessionEffects', () => {
  it('ends choice loading when a decision lands in the narrative store', () => {
    const { result } = renderHook(() => {
      const [isGenerating, setIsGenerating] = React.useState(false);
      const [initialized, setInitialized] = React.useState(false);
      const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(true);

      useActiveGameSessionEffects({
        sessionId: 'session-1',
        controllerKey: 'controller-1',
        setIsGenerating,
        setInitialized,
        setIsGeneratingChoices,
      });

      return { isGenerating, initialized, isGeneratingChoices };
    });

    act(() => {
      useNarrativeStore.getState().addDecision('session-1', {
        prompt: 'What will you do?',
        options: [{ id: 'option-1', text: 'Look around', alignment: 'neutral' }],
        decisionWeight: 'minor',
      });
    });

    expect(result.current.isGeneratingChoices).toBe(false);
  });

  it('waits on choices when a resumed passage came from the latest decision', () => {
    const decisionId = useNarrativeStore.getState().addDecision('session-2', {
      prompt: 'What will you do?',
      options: [{ id: 'option-1', text: 'Look around', alignment: 'neutral' }],
      selectedOptionId: 'option-1',
      decisionWeight: 'minor',
    });
    useNarrativeStore.getState().addSegment('session-2', {
      content: 'You look around the quiet hall.',
      type: 'scene',
      characterIds: [],
      metadata: { tags: [], causedByDecisionId: decisionId },
      worldId: 'world-1',
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => {
      const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
      const [, setIsGenerating] = React.useState(false);
      const [, setInitialized] = React.useState(false);

      useActiveGameSessionEffects({
        sessionId: 'session-2',
        controllerKey: 'controller-2',
        setIsGenerating,
        setInitialized,
        setIsGeneratingChoices,
      });

      return isGeneratingChoices;
    });

    expect(result.current).toBe(true);
  });
});
