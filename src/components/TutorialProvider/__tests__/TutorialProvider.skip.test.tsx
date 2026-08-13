import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../index';
import { useSessionStore } from '@/state/sessionStore';

// Runs against the real react-joyride runtime on purpose: the tour's own
// callback never reports a skip taken on the first step, and Escape arrives as
// an ordinary step change, so a mocked runtime can't show whether dismissal
// actually sticks.

const StartFirstPlay = () => {
  const { startTour, isTourActive } = useTutorial();

  return (
    <div>
      <div data-testid="tour-status">{isTourActive ? 'Active' : 'Inactive'}</div>
      <div data-tutorial="narrative-display">Narrative</div>
      <div data-tutorial="player-choices">Choices</div>
      <button onClick={() => startTour('firstPlay')}>Start First Play Tour</button>
    </div>
  );
};

describe('TutorialProvider dismissal handling', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('records the phase as skipped when the player skips on the first step', async () => {
    render(
      <TutorialProvider>
        <StartFirstPlay />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start First Play Tour').click();
    });

    const skipButton = await screen.findByRole('button', { name: /skip/i });

    await act(async () => {
      skipButton.click();
    });

    expect(useSessionStore.getState().tutorialProgress.phases.firstPlay.skipped).toBe(true);
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Inactive');
  });

  it('ends the tour instead of advancing it when the player presses Escape', async () => {
    render(
      <TutorialProvider>
        <StartFirstPlay />
      </TutorialProvider>
    );

    await act(async () => {
      screen.getByText('Start First Play Tour').click();
    });

    await screen.findByRole('button', { name: /skip/i });

    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    });

    expect(useSessionStore.getState().tutorialProgress.phases.firstPlay.skipped).toBe(true);
    expect(screen.getByTestId('tour-status')).toHaveTextContent('Inactive');
  });
});
