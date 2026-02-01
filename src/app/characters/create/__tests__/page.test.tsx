import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';

const mockStartTour = jest.fn();
let triggerCustomize = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    startTour: mockStartTour,
    isTourActive: false,
    stopTour: jest.fn(),
  }),
}));

jest.mock('@/components/QuickStartCharacters/QuickStartCharacters', () => ({
  QuickStartCharacters: ({
    onReady,
    onCustomizeClick,
  }: {
    onReady?: () => void;
    onCustomizeClick?: () => void;
  }) => {
    useEffect(() => {
      onReady?.();
      if (triggerCustomize) {
        triggerCustomize = false;
        onCustomizeClick?.();
      }
    }, [onReady, onCustomizeClick]);
    return <div data-testid="quickstart-characters" />;
  },
}));

jest.mock('@/components/CharacterCreationWizard', () => ({
  CharacterCreationWizard: () => <div data-testid="character-wizard" />,
}));

const mockWorldStore = {
  currentWorldId: 'world-1',
  setCurrentWorld: jest.fn(),
  worlds: {
    'world-1': { id: 'world-1', name: 'Test World' },
  },
};

const mockCharacterStore = {
  createCharacter: jest.fn(),
  setCurrentCharacter: jest.fn(),
};

const mockSessionStore = {
  initializeSession: jest.fn(),
  updateTutorialProgress: jest.fn(),
  shouldShowTutorialPhase: jest.fn(() => true),
  tutorialProgress: {
    phases: {
      characterCreation: {
        quickStartCompleted: false,
        completed: false,
        skipped: false,
        lastStep: 0,
      },
    },
  },
};

jest.mock('@/state/sessionStore', () => {
  const useSessionStore = (selector: (store: typeof mockSessionStore) => unknown) =>
    selector ? selector(mockSessionStore) : mockSessionStore;
  useSessionStore.getState = () => mockSessionStore;
  return { useSessionStore };
});

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => mockWorldStore,
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => mockCharacterStore,
}));

const setQuickStartCompleted = (quickStartCompleted: boolean) => {
  mockSessionStore.tutorialProgress.phases.characterCreation.quickStartCompleted = quickStartCompleted;
};

const setTriggerCustomize = (value: boolean) => {
  triggerCustomize = value;
};

const resetSessionStore = () => ({
  initializeSession: jest.fn(),
  updateTutorialProgress: jest.fn(),
  shouldShowTutorialPhase: jest.fn(() => true),
  tutorialProgress: {
    phases: {
      characterCreation: {
        quickStartCompleted: false,
        completed: false,
        skipped: false,
        lastStep: 0,
      },
    },
  },
});

describe('CharacterCreatePage tutorial start', () => {
  beforeEach(() => {
    mockStartTour.mockClear();
    Object.assign(mockSessionStore, resetSessionStore());
    setTriggerCustomize(false);
  });

  it('starts quick start tour when not completed', async () => {
    setQuickStartCompleted(false);
    const { default: Page } = await import('../page');
    render(<Page />);

    await waitFor(() => {
      expect(mockStartTour).toHaveBeenCalledWith('quickStartSelection');
    });
  });

  it('does not restart quick start tour after completion', async () => {
    setQuickStartCompleted(true);
    const { default: Page } = await import('../page');
    render(<Page />);

    await waitFor(() => {
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  it('does not auto-start wizard tour after character creation is completed', async () => {
    jest.useFakeTimers();
    try {
      setQuickStartCompleted(true);
      mockSessionStore.tutorialProgress.phases.characterCreation.completed = true;
      mockSessionStore.shouldShowTutorialPhase = jest.fn(() => false);
      setTriggerCustomize(true);

      const { default: Page } = await import('../page');
      render(<Page />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(mockStartTour).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
