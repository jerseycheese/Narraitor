import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldCreationWizard from '../WorldCreationWizard';
import { useProviderStore } from '@/state/providerStore';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: any) => {
    const state = {
      createWorld: jest.fn().mockReturnValue('world-123'),
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
      phases: { worldCreation: { completed: true, skipped: false, lastStep: 0 } },
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

jest.mock('@/lib/services/worldCreationService', () => ({
  ensureWorldNpcRoster: jest.fn().mockResolvedValue(undefined),
}));

// The suggestion call fails on every case here; only the presence of a
// configured provider key should change the message shown for it.
jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn().mockRejectedValue(new Error('network error')),
}));

const LONG_DESCRIPTION =
  'A frontier settlement built into the walls of an ancient, half-buried starship, where the old machine spirits are bargained with rather than fixed.';

describe('WorldCreationWizard AI-generation error messaging', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    useProviderStore.setState({ providers: {} });
  });

  it('tells the player generation needs a key when none is configured', async () => {
    render(<WorldCreationWizard initialStep={1} />);

    const descriptionInput = screen.getByTestId('world-full-description');
    await user.type(descriptionInput, LONG_DESCRIPTION);
    await user.click(screen.getByTestId('generate-ai-suggestions'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-warning')).toHaveTextContent(
        /generating suggestions needs a provider key/i
      );
    });
    expect(screen.getByTestId('ai-warning')).not.toHaveTextContent(/service recovers/i);
  });

  it('keeps the generic service-trouble message when a key is configured', async () => {
    useProviderStore.setState({
      providers: {
        p1: {
          id: 'p1',
          name: 'Gemini',
          type: 'gemini',
          endpoint: 'https://example.test',
          model: 'gemini-2.5-flash',
          capabilities: { text: true, images: false, streaming: true },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    });

    render(<WorldCreationWizard initialStep={1} />);

    const descriptionInput = screen.getByTestId('world-full-description');
    await user.type(descriptionInput, LONG_DESCRIPTION);
    await user.click(screen.getByTestId('generate-ai-suggestions'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-warning')).toHaveTextContent(/service recovers/i);
    });
    expect(screen.getByTestId('ai-warning')).not.toHaveTextContent(/provider key/i);
  });
});
