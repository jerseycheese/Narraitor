import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../index';
import { useSessionStore } from '@/state/sessionStore';

// Mock React Joyride
let lastJoyrideProps: Record<string, unknown> | null = null;

jest.mock('react-joyride', () => {
  const STATUS = {
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  };

  const EVENTS = {
    TARGET_NOT_FOUND: 'target_not_found',
  };

  const ACTIONS = {
    PREV: 'prev',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DummyJoyride = ({ run, stepIndex, steps, callback, ...rest }: any) => {
    lastJoyrideProps = { run, stepIndex, steps, callback, ...rest };
    if (!run) return null;
    return (
      <div data-testid="joyride-mock">
        <div>Step Index: {stepIndex}</div>
        <div>Total Steps: {steps.length}</div>
        <button onClick={() => callback({ status: STATUS.FINISHED })}>Complete Tour</button>
        <button onClick={() => callback({ status: STATUS.SKIPPED })}>Skip Tour</button>
        <button onClick={() => callback({ type: EVENTS.TARGET_NOT_FOUND })}>Target Missing</button>
        <button onClick={() => callback({ type: EVENTS.TARGET_NOT_FOUND, index: steps.length - 1 })}>Target Missing Last</button>
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

// Mock dynamic imports for tours
jest.mock('@/lib/tutorial/worldCreationTour', () => ({
  worldCreationTour: [
    { target: 'body', content: 'Step 1' }, 
    { target: 'body', content: 'Step 2' },
    { target: 'body', content: 'Step 3' }
  ],
  tourStepToWizardStep: { 0: 0, 1: 0, 2: 1 }
}));

jest.mock('@/lib/tutorial/characterCreationWizardTour', () => ({
  characterCreationWizardTour: [
    { target: 'body', content: 'Step 1' },
    { target: 'body', content: 'Step 2' }
  ],
  tourStepToWizardStep: { 0: 0, 1: 1 }
}));

const TestComponent = () => {
  const { startTour, stopTour, isTourActive, stepIndex, setCurrentWizardStep } = useTutorial();
  
  return (
    <div>
      <div data-testid="tour-status">{isTourActive ? 'Active' : 'Inactive'}</div>
      <div data-testid="step-index">{stepIndex}</div>
      <button onClick={() => startTour('worldCreation')}>Start World Tour</button>
      <button onClick={() => startTour('characterCreationWizard')}>Start Character Wizard Tour</button>
      <button onClick={() => startTour('firstPlay')}>Start First Play Tour</button>
      <button onClick={stopTour}>Stop Tour</button>
      <button onClick={() => setCurrentWizardStep(1)}>Wizard Step 1</button>
    </div>
  );
};

describe('TutorialProvider', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
    lastJoyrideProps = null;
  });

  it('provides tutorial context', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );
    
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Inactive');
  });

  it('starts a tour', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );
    
    await act(async () => {
      screen.getByText('Start World Tour').click();
    });
    
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active');
    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
  });

  it('disables beacons for all tour steps', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start World Tour').click();
    });

    const steps = lastJoyrideProps?.steps as Array<{ disableBeacon?: boolean }> | undefined;

    expect(steps).toBeDefined();
    expect(steps?.every((step) => step.disableBeacon === true)).toBe(true);
  });

  // Joyride's scroll-parent fix writes an inline `overflow` onto whichever
  // ancestor scrolls. On the play surface that's `.manuscript-overlay-main`,
  // and overriding its `overflow-y: auto` lets the story escape its grid row
  // and paint over the action rail for the rest of the session.
  it('never takes over the scroll parent', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start World Tour').click();
    });

    expect(lastJoyrideProps?.disableScrollParentFix).toBe(true);
  });

  it('starts the character wizard tour when on the first step', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start Character Wizard Tour').click();
    });

    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active');
    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
  });

  it('stops a tour', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );
    
    await act(async () => {
      screen.getByText('Start World Tour').click();
    });
    
    await act(async () => {
      screen.getByText('Stop Tour').click();
    });
    
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Inactive');
    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
  });

  it('pauses the world creation tour when the target is not found', async () => {
    jest.useFakeTimers();

    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start World Tour').click();
    });

    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('Target Missing').click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active');

    jest.useRealTimers();
  });

  it('resumes the world creation tour when the wizard advances after a pause', async () => {
    jest.useFakeTimers();

    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start World Tour').click();
    });

    await act(async () => {
      screen.getByText('Target Missing').click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();

    jest.useRealTimers();

    await act(async () => {
      screen.getByText('Wizard Step 1').click();
      await Promise.resolve();
    });

    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
    expect(screen.getByTestId('step-index')).toHaveTextContent('2');
  });

  it('completes a mapping-less tour when its final target is missing instead of hanging', async () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start First Play Tour').click();
    });
    await screen.findByTestId('joyride-mock');
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Active');

    // firstPlay has no stepMapping; a missing final anchor (e.g. the Tools button in
    // DS3 / progressive-disclosure-off) must end the tour and mark the phase complete,
    // not leave it paused with isTourActive stuck true.
    await act(async () => {
      screen.getByText('Target Missing Last').click();
    });

    expect(screen.getByTestId('tour-status')).toHaveTextContent('Inactive');
    expect(
      useSessionStore.getState().tutorialProgress.phases.firstPlay.completed
    ).toBe(true);
  });
});
