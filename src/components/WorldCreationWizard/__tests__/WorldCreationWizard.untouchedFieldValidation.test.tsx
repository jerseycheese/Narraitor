import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldCreationWizard from '../WorldCreationWizard';

const mockPush = jest.fn();
const mockCreateWorld = jest.fn().mockReturnValue('world-123');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

type MockWorldStoreState = {
  createWorld: jest.Mock;
  setCurrentWorld: jest.Mock;
  updateWorld: jest.Mock;
  worlds: Record<string, unknown>;
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector?: (state: MockWorldStoreState) => unknown) => {
    const state: MockWorldStoreState = {
      createWorld: mockCreateWorld,
      setCurrentWorld: jest.fn(),
      updateWorld: jest.fn(),
      worlds: {},
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: () => ({
    tutorialProgress: {
      phases: {
        worldCreation: { completed: true, skipped: false, lastStep: 0 },
      },
    },
  }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    setCurrentWizardStep: jest.fn(),
    pauseTour: jest.fn(),
    resumeTour: jest.fn(),
    startTour: jest.fn(),
    isTourActive: false,
    isPaused: false,
    stepIndex: 0,
    currentTour: null,
  }),
}));

jest.mock('@/lib/ai/worldImageGenerator', () => ({
  generateWorldImage: jest.fn().mockResolvedValue({ url: 'http://example.com/image.png' }),
}));

jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn().mockResolvedValue({
    attributes: [],
    skills: [],
  }),
}));

jest.mock('@/lib/services/worldCreationService', () => ({
  ensureWorldNpcRoster: jest.fn().mockResolvedValue(undefined),
}));

describe('WorldCreationWizard untouched-field validation (#2178)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('does not show the genre-required error just from typing in the (untouched) name field', async () => {
    const user = userEvent.setup();
    render(<WorldCreationWizard />);

    const nameInput = await screen.findByTestId('world-name-input');
    await user.type(nameInput, 'Aldenreach');

    expect(screen.queryByText(/world genre is required/i)).not.toBeInTheDocument();
  });

  it('shows the genre-required error once the player presses Next with genre empty', async () => {
    const user = userEvent.setup();
    render(<WorldCreationWizard />);

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByText(/world genre is required/i)).toBeInTheDocument();
  });
});
