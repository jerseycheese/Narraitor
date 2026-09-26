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

const mockSetAutoSaveData = jest.fn();
jest.mock('@/hooks/useDraftAutoSave', () => {
  const actual = jest.requireActual('@/hooks/useDraftAutoSave');
  return {
    ...actual,
    useDraftAutoSave: (options: unknown) => {
      const res = actual.useDraftAutoSave(options);
      const { setData } = res;
      const stableSetData = React.useCallback(
        (...args: unknown[]) => {
          mockSetAutoSaveData(...args);
          return setData(...args);
        },
        [setData]
      );
      return {
        ...res,
        setData: stableSetData,
      };
    },
  };
});

describe('WorldCreationWizard description update loop and autosave write count (#2174)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('triggers at most one autosave write per change when typing in description', async () => {
    const user = userEvent.setup();

    render(
      <WorldCreationWizard
        initialStep={1}
        initialData={{ genre: 'fantasy', description: '' }}
      />
    );

    const descriptionInput = await screen.findByTestId('world-full-description');
    expect(descriptionInput).toBeInTheDocument();

    // Clear any initial load autosave calls
    mockSetAutoSaveData.mockClear();

    // Type a single character
    await user.type(descriptionInput, 'A');

    // Verify at most one autosave write occurred for that change
    expect(mockSetAutoSaveData).toHaveBeenCalledTimes(1);
    expect(mockSetAutoSaveData).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
        worldData: expect.objectContaining({
          description: 'A',
        }),
      })
    );
  });

  it('does not trigger "Maximum update depth exceeded" error while typing in StrictMode', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <React.StrictMode>
        <WorldCreationWizard
          initialStep={1}
          initialData={{ genre: 'fantasy', description: '' }}
        />
      </React.StrictMode>
    );

    const descriptionInput = await screen.findByTestId('world-full-description');
    expect(descriptionInput).toBeInTheDocument();

    // Rapidly type a multi-character description
    await user.type(descriptionInput, 'A realm divided by enchanted storms and forgotten ruins.');

    expect(descriptionInput).toHaveValue(
      'A realm divided by enchanted storms and forgotten ruins.'
    );

    // Verify no "Maximum update depth exceeded" error was logged
    const loopErrors = consoleErrorSpy.mock.calls.filter((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Maximum update depth exceeded') ||
            arg.includes('Cannot update a component while rendering a different component'))
      )
    );
    expect(loopErrors).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });
});
