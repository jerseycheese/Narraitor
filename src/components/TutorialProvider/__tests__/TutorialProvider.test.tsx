import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../index';
import { useSessionStore } from '@/state/sessionStore';

// Mock React Joyride
jest.mock('react-joyride', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function DummyJoyride({ run, stepIndex, steps, callback }: any) {
    if (!run) return null;
    return (
      <div data-testid="joyride-mock">
        <div>Step Index: {stepIndex}</div>
        <div>Total Steps: {steps.length}</div>
        <button onClick={() => callback({ status: 'finished' })}>Complete Tour</button>
        <button onClick={() => callback({ status: 'skipped' })}>Skip Tour</button>
      </div>
    );
  };
});

// Mock dynamic imports for tours
jest.mock('@/lib/tutorial/worldCreationTour', () => ({
  worldCreationTour: [{ target: 'body', content: 'Step 1' }, { target: 'body', content: 'Step 2' }],
  tourStepToWizardStep: { 0: 0, 1: 1 }
}));

const TestComponent = () => {
  const { startTour, stopTour, isTourActive, stepIndex } = useTutorial();
  
  return (
    <div>
      <div data-testid="tour-status">{isTourActive ? 'Active' : 'Inactive'}</div>
      <div data-testid="step-index">{stepIndex}</div>
      <button onClick={() => startTour('worldCreation')}>Start World Tour</button>
      <button onClick={stopTour}>Stop Tour</button>
    </div>
  );
};

describe('TutorialProvider', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
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
});
