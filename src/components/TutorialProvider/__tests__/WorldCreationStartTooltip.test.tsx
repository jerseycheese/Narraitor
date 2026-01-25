import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { TooltipRenderProps, Styles } from 'react-joyride';
import { WorldCreationStartTooltip } from '../WorldCreationStartTooltip';

const mockSkipTour = jest.fn();

jest.mock('@/components/TutorialProvider/useTutorial', () => ({
  useTutorial: () => ({
    pauseTour: jest.fn(),
    skipTour: mockSkipTour,
  }),
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (store: { updateTutorialProgress: () => void }) => unknown) =>
    selector({ updateTutorialProgress: jest.fn() }),
}));

const baseStyles: Styles = {
  options: {},
  tooltip: {},
  tooltipContainer: {},
  tooltipTitle: {},
  tooltipContent: {},
  tooltipFooter: {},
  tooltipFooterSpacer: {},
  buttonNext: {},
  buttonBack: {},
  beacon: {},
  beaconInner: {},
  beaconOuter: {},
  buttonClose: {},
  buttonSkip: {},
  spotlight: {},
  spotlightLegacy: {},
  overlay: {},
  overlayLegacy: {},
  overlayLegacyCenter: {},
};

const createProps = (overrides: Partial<TooltipRenderProps> = {}): TooltipRenderProps => {
  const defaultProps: TooltipRenderProps = {
    backProps: {
      'aria-label': 'Back',
      'data-action': 'back',
      role: 'button',
      title: 'Back',
      onClick: jest.fn(),
    },
    index: 0,
    isLastStep: false,
    primaryProps: {
      'aria-label': 'Next',
      'data-action': 'primary',
      role: 'button',
      title: 'Next',
      onClick: jest.fn(),
    },
    skipProps: {
      'aria-label': 'Skip world creation tutorial',
      'data-action': 'skip',
      role: 'button',
      title: 'Skip world creation tutorial',
      onClick: jest.fn(),
    },
    step: {
      target: 'body',
      content: 'Step content',
      showSkipButton: true,
      styles: baseStyles,
      locale: {
        back: 'Back',
        close: 'Close',
        last: 'Last',
        next: 'Next',
        open: 'Open',
        skip: 'Skip',
      },
      placement: 'bottom',
    } as TooltipRenderProps['step'],
    tooltipProps: {
      'aria-modal': true,
      ref: () => {},
      role: 'alertdialog',
    },
    closeProps: {
      'aria-label': 'Close',
      'data-action': 'close',
      role: 'button',
      title: 'Close',
      onClick: jest.fn(),
    },
    continuous: true,
    size: 1,
  };

  return { ...defaultProps, ...overrides };
};

describe('WorldCreationStartTooltip', () => {
  beforeEach(() => {
    mockSkipTour.mockClear();
  });

  it('calls skipTour when the skip button is clicked', () => {
    render(<WorldCreationStartTooltip {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip world creation tutorial' }));

    expect(mockSkipTour).toHaveBeenCalledTimes(1);
  });
});
