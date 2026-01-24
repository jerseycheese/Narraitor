import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { TooltipRenderProps } from 'react-joyride';
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

const baseStyles = {
  tooltip: {},
  tooltipContainer: {},
  tooltipTitle: {},
  tooltipContent: {},
  tooltipFooter: {},
  tooltipFooterSpacer: {},
  buttonNext: {},
  buttonBack: {},
};

const createProps = (overrides: Partial<TooltipRenderProps> = {}): TooltipRenderProps => ({
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
  },
  tooltipProps: {},
  closeProps: {
    'aria-label': 'Close',
    'data-action': 'close',
    role: 'button',
    title: 'Close',
    onClick: jest.fn(),
  },
  continuous: true,
  size: 1,
  ...overrides,
});

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
