import React from 'react';
import { render, screen } from '@testing-library/react';
import type { TooltipRenderProps } from 'react-joyride';
import { TutorialTooltip } from '../TutorialTooltip';

jest.mock('@/components/TutorialProvider/useTutorial', () => ({
  useTutorial: () => ({
    pauseTour: jest.fn(),
    currentTour: 'worldGeneration',
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
  isLastStep: true,
  primaryProps: {
    'aria-label': 'Finish',
    'data-action': 'primary',
    role: 'button',
    title: 'Finish',
    onClick: jest.fn(),
  },
  skipProps: {
    'aria-label': 'Skip tutorial',
    'data-action': 'skip',
    role: 'button',
    title: 'Skip tutorial',
    onClick: jest.fn(),
  },
  step: {
    target: 'body',
    content: 'Step content',
    showSkipButton: true,
    styles: baseStyles,
    data: {
      hideNextButton: true,
    },
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

describe('TutorialTooltip', () => {
  it('shows skip button on last step when next is hidden', () => {
    render(<TutorialTooltip {...createProps()} />);

    expect(screen.getByRole('button', { name: 'Skip tutorial' })).toBeInTheDocument();
  });
});
