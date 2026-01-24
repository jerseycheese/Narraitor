import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../index';
import { useSessionStore } from '@/state/sessionStore';

let joyrideMounts = 0;
let joyrideUnmounts = 0;
let resizeObserverCallback: ResizeObserverCallback | null = null;

// Mock React Joyride
jest.mock('react-joyride', () => {
  const React = require('react');
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
  const DummyJoyride = ({ run, stepIndex, steps, callback }: any) => {
    if (!run) return null;
    React.useEffect(() => {
      joyrideMounts += 1;
      return () => {
        joyrideUnmounts += 1;
      };
    }, []);
    return (
      <div data-testid="joyride-mock">
        <div>Step Index: {stepIndex}</div>
        <div>Total Steps: {steps.length}</div>
        <button onClick={() => callback({ status: STATUS.FINISHED })}>Complete Tour</button>
        <button onClick={() => callback({ status: STATUS.SKIPPED })}>Skip Tour</button>
        <button onClick={() => callback({ type: EVENTS.TARGET_NOT_FOUND })}>Target Missing</button>
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
    { target: '#layout-target', content: 'Step 1' }, 
    { target: '#layout-target', content: 'Step 2' },
    { target: '#layout-target', content: 'Step 3' }
  ],
  tourStepToWizardStep: { 0: 0, 1: 0, 2: 1 }
}));

const TestComponent = () => {
  const { startTour, stopTour, isTourActive, stepIndex, setCurrentWizardStep } = useTutorial();
  
  return (
    <div>
      <div id="layout-target" data-testid="layout-target" />
      <div data-testid="tour-status">{isTourActive ? 'Active' : 'Inactive'}</div>
      <div data-testid="step-index">{stepIndex}</div>
      <button onClick={() => startTour('worldCreation')}>Start World Tour</button>
      <button onClick={stopTour}>Stop Tour</button>
      <button onClick={() => setCurrentWizardStep(1)}>Wizard Step 1</button>
    </div>
  );
};

describe('TutorialProvider', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
    joyrideMounts = 0;
    joyrideUnmounts = 0;
    resizeObserverCallback = null;
    global.ResizeObserver = class ResizeObserver {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        resizeObserverCallback = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    };
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

  it('refreshes the tour layout when the target position changes', async () => {
    jest.useFakeTimers();
    const originalAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(0), 0);
    };

    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    const target = screen.getByTestId('layout-target');
    let topOffset = 0;
    target.getBoundingClientRect = jest.fn(() => ({
      top: topOffset,
      left: 0,
      width: 100,
      height: 20,
      right: 100,
      bottom: topOffset + 20,
      x: 0,
      y: topOffset,
      toJSON: () => ({}),
    })) as unknown as typeof target.getBoundingClientRect;

    await act(async () => {
      screen.getByText('Start World Tour').click();
    });

    expect(joyrideMounts).toBe(1);

    topOffset = 120;

    act(() => {
      resizeObserverCallback?.([], {} as ResizeObserver);
      jest.runOnlyPendingTimers();
    });

    expect(joyrideMounts).toBe(2);

    global.requestAnimationFrame = originalAnimationFrame;
    jest.useRealTimers();
  });
});
