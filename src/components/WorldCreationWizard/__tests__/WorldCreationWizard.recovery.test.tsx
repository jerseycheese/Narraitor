import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldCreationWizard from '../WorldCreationWizard';
import { DRAFT_STORAGE_KEY } from '@/hooks/useWorldCreationAutoSave';

const mockPush = jest.fn();
const mockCreateWorld = jest.fn().mockReturnValue('world-123');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({
        createWorld: mockCreateWorld,
        setCurrentWorld: jest.fn(),
        updateWorld: jest.fn(),
        worlds: {},
      });
    }
    return {
      createWorld: mockCreateWorld,
      setCurrentWorld: jest.fn(),
      updateWorld: jest.fn(),
      worlds: {},
    };
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

describe('WorldCreationWizard draft auto-save and recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders recovery dialog when draft exists in localStorage', async () => {
    const draft = {
      currentStep: 1,
      worldData: {
        name: 'Solaria',
        genre: 'Sci-Fi',
        description: 'A futuristic city-state among the stars with advanced cybernetics.',
      },
      lastSaved: '2026-09-07T20:00:00.000Z',
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    render(<WorldCreationWizard />);

    await waitFor(() => {
      expect(screen.getByText(/World Creation Progress Found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Solaria/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sci-Fi/i)[0]).toBeInTheDocument();
  });

  it('restores draft into wizard state when Recover Progress is clicked', async () => {
    const user = userEvent.setup();
    const draft = {
      currentStep: 1,
      worldData: {
        name: 'Solaria',
        genre: 'Sci-Fi',
        description: 'A futuristic city-state among the stars with advanced cybernetics.',
      },
      lastSaved: '2026-09-07T20:00:00.000Z',
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    render(<WorldCreationWizard />);

    const recoverButton = await screen.findByRole('button', { name: /Recover Progress/i });
    await user.click(recoverButton);

    // Should switch to step 1 (Description) with restored description
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });

    const descriptionInput = screen.getByTestId('world-full-description');
    expect(descriptionInput).toHaveValue('A futuristic city-state among the stars with advanced cybernetics.');
  });

  it('clears draft from localStorage when Start Fresh is clicked', async () => {
    const user = userEvent.setup();
    const draft = {
      currentStep: 0,
      worldData: {
        name: 'Discarded World',
        genre: 'Fantasy',
      },
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    render(<WorldCreationWizard />);

    const startFreshButton = await screen.findByRole('button', { name: /Start Fresh/i });
    await user.click(startFreshButton);

    await waitFor(() => {
      expect(screen.queryByText(/World Creation Progress Found/i)).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears draft from localStorage on cancel confirmation', async () => {
    const user = userEvent.setup();
    render(<WorldCreationWizard />);

    // Type a genre to make form dirty
    const select = screen.getByLabelText(/genre/i);
    await user.selectOptions(select, 'fantasy');

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    // Confirmation dialog appears
    const confirmButton = await screen.findByRole('button', { name: /Yes, Cancel/i });
    await user.click(confirmButton);

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
