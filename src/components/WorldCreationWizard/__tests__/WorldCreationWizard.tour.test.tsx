import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '@/components/TutorialProvider';
import WorldCreationWizard from '../WorldCreationWizard';
import { useSessionStore } from '@/state/sessionStore';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock auto save to avoid recovery dialog
jest.mock('@/hooks/useWorldCreationAutoSave', () => ({
  useWorldCreationAutoSave: () => ({
    data: undefined,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    dismissRecovery: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: undefined,
    hasCurrentData: false,
    isLoaded: true,
    saveStatus: 'idle' as const,
    lastSaved: undefined,
  }),
}));

// Mock worldStore
const mockCreateWorld = jest.fn().mockReturnValue('world-123');

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

// Mock AI generators
jest.mock('@/lib/ai/worldImageGenerator', () => ({
  generateWorldImage: jest.fn().mockResolvedValue({ url: 'http://example.com/image.png' }),
}));

jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn().mockResolvedValue({
    attributes: [],
    skills: [],
  }),
}));

// Mock react-joyride to simulate clicking Joyride's own Next/Prev buttons
let _lastJoyrideProps: Record<string, unknown> | null = null;

jest.mock('react-joyride', () => {
  const STATUS = {
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  };

  const EVENTS = {
    TARGET_NOT_FOUND: 'target_not_found',
    STEP_AFTER: 'step_after',
  };

  const ACTIONS = {
    NEXT: 'next',
    PREV: 'prev',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DummyJoyride = ({ run, stepIndex, steps, callback, ...rest }: any) => {
    _lastJoyrideProps = { run, stepIndex, steps, callback, ...rest };
    if (!run) return null;

    const isLast = stepIndex >= steps.length - 1;

    return (
      <div data-testid="joyride-mock">
        <div data-testid="joyride-step-index">{stepIndex}</div>
        <div data-testid="joyride-total-steps">{steps.length}</div>
        {!isLast && (
          <button
            data-testid="joyride-next-btn"
            onClick={() => callback({ action: ACTIONS.NEXT, type: EVENTS.STEP_AFTER, index: stepIndex })}
          >
            Joyride Next
          </button>
        )}
        {stepIndex > 0 && (
          <button
            data-testid="joyride-prev-btn"
            onClick={() => callback({ action: ACTIONS.PREV, type: EVENTS.STEP_AFTER, index: stepIndex })}
          >
            Joyride Prev
          </button>
        )}
        {isLast && (
          <button
            data-testid="joyride-finish-btn"
            onClick={() => callback({ status: STATUS.FINISHED, index: stepIndex })}
          >
            Finish Tutorial
          </button>
        )}
      </div>
    );
  };

  return {
    __esModule: true,
    default: DummyJoyride,
    STATUS,
    EVENTS,
    ACTIONS,
  };
});

// Helper component to trigger tour start
const TourTrigger = () => {
  const { startTour, isTourActive } = useTutorial();
  return (
    <div>
      <div data-testid="tour-active">{isTourActive ? 'yes' : 'no'}</div>
      <button
        data-testid="start-world-tour-btn"
        onClick={() => startTour('worldCreation')}
      >
        Start World Creation Tour
      </button>
    </div>
  );
};

describe('WorldCreationWizard tour and step sync integration', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
    _lastJoyrideProps = null;
  });

  it('preserves manual wizard Next and Back navigation mid-tour without reverting', async () => {
    render(
      <TutorialProvider>
        <TourTrigger />
        <WorldCreationWizard initialData={{ genre: 'fantasy' }} />
      </TutorialProvider>
    );

    // Start tour
    await act(async () => {
      screen.getByTestId('start-world-tour-btn').click();
    });

    expect(screen.getByTestId('tour-active')).toHaveTextContent('yes');
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('0');
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Click the wizard's own Next button (advances wizard from step 0 to step 1)
    const wizardNextButton = screen.getByRole('button', { name: /^next$/i });
    await act(async () => {
      wizardNextButton.click();
    });

    // Wizard should advance to step 1 (Description) and not be reverted to step 0
    expect(screen.getByTestId('description-step')).toBeInTheDocument();
    expect(screen.queryByTestId('basic-info-step')).toBeNull();

    // Click the wizard's own Back button (returns wizard from step 1 to step 0)
    const wizardBackButton = screen.getByRole('button', { name: /^back$/i });
    await act(async () => {
      wizardBackButton.click();
    });

    // Wizard should return to step 0 (Basic Info) and not be reverted to step 1
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.queryByTestId('description-step')).toBeNull();
  });

  it('advances wizard step when tour stepIndex advances to a new wizard step via Joyride Next', async () => {
    render(
      <TutorialProvider>
        <TourTrigger />
        <WorldCreationWizard initialData={{ genre: 'fantasy' }} />
      </TutorialProvider>
    );

    // Start tour
    await act(async () => {
      screen.getByTestId('start-world-tour-btn').click();
    });

    expect(screen.getByTestId('tour-active')).toHaveTextContent('yes');
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('0');
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Advance through tour steps 0-7 (all mapped to wizard step 0)
    for (let i = 0; i < 7; i++) {
      await act(async () => {
        screen.getByTestId('joyride-next-btn').click();
      });
    }

    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('7');
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Advance from step 7 to step 8 (mapped to wizard step 1)
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });

    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('8');
    // Wizard should have synced and advanced to step 1 (Description)
    expect(screen.getByTestId('description-step')).toBeInTheDocument();
    expect(screen.queryByTestId('basic-info-step')).toBeNull();

    // Now click Joyride Prev (from step 8 back to step 7)
    await act(async () => {
      screen.getByTestId('joyride-prev-btn').click();
    });

    // Wizard should sync back to step 0 (Basic Info)
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.queryByTestId('description-step')).toBeNull();
  });
});
