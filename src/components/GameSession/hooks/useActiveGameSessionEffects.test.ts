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
});
