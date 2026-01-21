import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TutorialTooltip } from '@/components/TutorialProvider/TutorialTooltip';
import { TutorialContext } from '@/components/TutorialProvider/TutorialProvider';
import { joyrideStyles } from '@/lib/tutorial/tutorialConfig';

const meta: Meta<typeof TutorialTooltip> = {
  title: 'Molecules/Tutorial/TutorialTooltip',
  component: TutorialTooltip,
  decorators: [
    (Story) => (
      <TutorialContext.Provider
        value={{
          startTour: () => {},
          stopTour: () => {},
          pauseTour: () => {},
          nextStep: () => {},
          prevStep: () => {},
          skipTour: () => {},
          resetTutorial: () => {},
          isTourActive: true,
          currentTour: 'worldCreation',
          stepIndex: 0,
          setCurrentWizardStep: () => {},
        }}
      >
        <div className="p-10 max-w-md">
          <Story />
        </div>
      </TutorialContext.Provider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TutorialTooltip>;

const defaultStep = {
  content: 'This is the content of the tutorial step. It explains how to use a specific feature.',
  title: 'Tutorial Step Title',
  disableBeacon: true,
  target: 'body',
  styles: joyrideStyles,
  placement: 'bottom' as const,
  showSkipButton: true,
};

const defaultProps = {
  index: 0,
  isLastStep: false,
  continuous: true,
  backProps: {
    'aria-label': 'Back',
    title: 'Back',
    onClick: () => console.log('Back clicked'),
  },
  primaryProps: {
    'aria-label': 'Next',
    title: 'Next',
    onClick: () => console.log('Next clicked'),
  },
  skipProps: {
    'aria-label': 'Skip',
    title: 'Skip tutorial',
    onClick: () => console.log('Skip clicked'),
  },
  tooltipProps: {},
  step: defaultStep,
};

export const Default: Story = {
  args: {
    ...defaultProps,
  } as any,
};

export const LastStep: Story = {
  args: {
    ...defaultProps,
    index: 5,
    isLastStep: true,
    primaryProps: {
      ...defaultProps.primaryProps,
      title: 'Finish',
    },
  } as any,
};

export const EndOfPage: Story = {
  args: {
    ...defaultProps,
    step: {
      ...defaultStep,
      data: { isEndOfPage: true },
    },
  } as any,
};

export const WithoutTitle: Story = {
  args: {
    ...defaultProps,
    step: {
      ...defaultStep,
      title: undefined,
    },
  } as any,
};
