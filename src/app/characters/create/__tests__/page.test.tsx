import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

const mockStartTour = jest.fn();
let worldIdParam: string | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => worldIdParam }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    startTour: mockStartTour,
    isTourActive: false,
  }),
}));

jest.mock('@/components/CharacterCreationWizard', () => ({
  CharacterCreationWizard: () => <div data-testid="character-wizard" />,
}));

const mockWorldStore = {
  currentWorldId: 'world-1',
  setCurrentWorld: jest.fn(),
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => mockWorldStore,
}));

const mockSessionStore = {
  shouldShowTutorialPhase: jest.fn(() => true),
};

jest.mock('@/state/sessionStore', () => {
  const useSessionStore = (selector: (store: typeof mockSessionStore) => unknown) =>
    selector ? selector(mockSessionStore) : mockSessionStore;
  useSessionStore.getState = () => mockSessionStore;
  return { useSessionStore };
});

describe('CharacterCreatePage', () => {
  beforeEach(() => {
    mockStartTour.mockClear();
    worldIdParam = null;
    mockWorldStore.currentWorldId = 'world-1';
    mockSessionStore.shouldShowTutorialPhase = jest.fn(() => true);
  });

  it('renders the character creation wizard for the active world', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);

    expect(await screen.findByTestId('character-wizard')).toBeInTheDocument();
  });

  it('starts the character-creation wizard tour for new players', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);

    await waitFor(() => {
      expect(mockStartTour).toHaveBeenCalledWith('characterCreationWizard');
    });
  });

  it('does not start the tour once the character-creation phase is done', async () => {
    jest.useFakeTimers();
    try {
      mockSessionStore.shouldShowTutorialPhase = jest.fn(() => false);
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
