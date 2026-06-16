import { renderHook, act } from '@testing-library/react';
import type { UseAutoSaveReturn } from '@/hooks/useAutoSave';
import { useActiveGameSessionActions } from '../useActiveGameSessionActions';

const mockSessionStoreState = {
  completeTutorialPhase: jest.fn(),
  shouldShowTutorialPhase: jest.fn(() => true),
};

const mockNarrativeStoreState = {
  selectDecisionOption: jest.fn(),
  updateDecision: jest.fn(),
  getSessionSegments: jest.fn(() => []),
};

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: Object.assign(
    jest.fn(() => mockSessionStoreState),
    { getState: jest.fn(() => mockSessionStoreState) }
  ),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: Object.assign(
    jest.fn(() => mockNarrativeStoreState),
    { getState: jest.fn(() => mockNarrativeStoreState) }
  ),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: Object.assign(
    jest.fn(),
    { getState: jest.fn(() => ({ characters: {} })) }
  ),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(
    jest.fn(),
    { getState: jest.fn(() => ({ worlds: {} })) }
  ),
}));

jest.mock('@/lib/ai/customActionSkillInference', () => ({
  inferCustomActionSkillChecks: jest.fn(async () => []),
}));

const buildOptions = (overrides = {}) => ({
  sessionId: 'session-1',
  characterId: 'character-1',
  currentDecision: null,
  setCurrentDecision: jest.fn(),
  setIsGenerating: jest.fn(),
  setShouldTriggerGeneration: jest.fn(),
  setIsGeneratingChoices: jest.fn(),
  setIsEvaluatingAction: jest.fn(),
  setLocalSelectedChoiceId: jest.fn(),
  choiceGenerationTimeoutRef: { current: null },
  scheduleChoiceFallback: jest.fn(),
  onChoiceSelected: jest.fn(),
  autoSave: { triggerSave: jest.fn() } as unknown as UseAutoSaveReturn,
  isSessionEnded: jest.fn(() => false),
  createDecisionJournalEntry: jest.fn(),
  createJournalEntryFromSegment: jest.fn(),
  ...overrides,
});

describe('useActiveGameSessionActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks first play tutorial as completed after a choice selection', () => {
    const { result } = renderHook(() => useActiveGameSessionActions(buildOptions()));

    act(() => {
      result.current.handleChoiceSelected('choice-1');
    });

    expect(mockSessionStoreState.completeTutorialPhase).toHaveBeenCalledWith('firstPlay');
  });

  it('marks first play tutorial as completed after a custom choice', async () => {
    const decision = { id: 'decision-1', prompt: 'What do you do?', options: [] };
    const { result } = renderHook(() =>
      useActiveGameSessionActions(buildOptions({ currentDecision: decision }))
    );

    await act(async () => {
      await result.current.handleCustomSubmit('Custom choice');
    });

    expect(mockSessionStoreState.completeTutorialPhase).toHaveBeenCalledWith('firstPlay');
  });

  it('does not complete first play tutorial when it is already finished', () => {
    mockSessionStoreState.shouldShowTutorialPhase.mockReturnValue(false);
    const { result } = renderHook(() => useActiveGameSessionActions(buildOptions()));

    act(() => {
      result.current.handleChoiceSelected('choice-1');
    });

    expect(mockSessionStoreState.completeTutorialPhase).not.toHaveBeenCalled();
  });

  describe('handleCustomSubmit — decision guard', () => {
    it('does nothing when there is no active decision', async () => {
      const onChoiceSelected = jest.fn();
      const { result } = renderHook(() =>
        useActiveGameSessionActions(buildOptions({ currentDecision: null, onChoiceSelected }))
      );

      await act(async () => {
        await result.current.handleCustomSubmit('I yell into the void');
      });

      expect(onChoiceSelected).not.toHaveBeenCalled();
      expect(mockNarrativeStoreState.updateDecision).not.toHaveBeenCalled();
    });

    it('registers the option and triggers generation when a decision is active', async () => {
      const onChoiceSelected = jest.fn();
      const decision = {
        id: 'decision-2',
        prompt: 'What do you do?',
        options: [{ id: 'opt-1', text: 'Run away' }],
      };
      const { result } = renderHook(() =>
        useActiveGameSessionActions(buildOptions({ currentDecision: decision, onChoiceSelected }))
      );

      await act(async () => {
        await result.current.handleCustomSubmit('I draw my sword');
      });

      expect(mockNarrativeStoreState.updateDecision).toHaveBeenCalledTimes(1);
      const [updatedId, patch] = mockNarrativeStoreState.updateDecision.mock.calls[0];
      expect(updatedId).toBe('decision-2');
      expect(patch.options).toHaveLength(2);
      expect(patch.options[1].text).toBe('I draw my sword');
      expect(patch.options[1].isCustomInput).toBe(true);

      // onChoiceSelected must be called with the same id that was registered
      expect(onChoiceSelected).toHaveBeenCalledTimes(1);
      expect(onChoiceSelected).toHaveBeenCalledWith(patch.selectedOptionId);
    });
  });
});
