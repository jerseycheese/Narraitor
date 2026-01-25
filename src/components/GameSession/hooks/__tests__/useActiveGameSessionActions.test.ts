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

const buildOptions = (overrides = {}) => ({
  sessionId: 'session-1',
  characterId: 'character-1',
  currentDecision: null,
  setCurrentDecision: jest.fn(),
  setIsGenerating: jest.fn(),
  setShouldTriggerGeneration: jest.fn(),
  setIsGeneratingChoices: jest.fn(),
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

  it('marks first play tutorial as completed after a custom choice', () => {
    const { result } = renderHook(() => useActiveGameSessionActions(buildOptions()));

    act(() => {
      result.current.handleCustomSubmit('Custom choice');
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
});
