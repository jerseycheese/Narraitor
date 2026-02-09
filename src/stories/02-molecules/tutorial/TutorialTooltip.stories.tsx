import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Joyride, { Step } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { TutorialTooltip } from '@/components/TutorialProvider/TutorialTooltip';
import { TutorialContext } from '@/components/TutorialProvider/TutorialProvider';
import { joyrideStyles } from '@/lib/tutorial/tutorialConfig';

const meta: Meta<typeof TutorialTooltip> = {
  title: '02-Molecules/tutorial/TutorialTooltip',
  component: TutorialTooltip,
  decorators: [
    (Story) => (
      <TutorialContext.Provider
        value={{
          startTour: () => {},
          stopTour: () => {},
          pauseTour: () => {},
          resumeTour: () => {},
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
        <div >
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
type Story = StoryObj<typeof meta>;

const defaultStep: Step = {
  content: 'This is the content of the tutorial step. It explains how to use a specific feature.',
  title: 'Tutorial Step Title',
  disableBeacon: true,
  target: '#tutorial-target',
  styles: joyrideStyles,
  placement: 'bottom' as const,
  showSkipButton: true,
};

const buildSteps = (step: Step, count: number): Step[] =>
  Array.from({ length: count }, () => ({
    ...step,
    target: '#tutorial-target',
  }));

interface TutorialTooltipJoyrideStoryProps {
  step: Step;
  stepIndex?: number;
  stepsCount?: number;
}

const TutorialTooltipJoyrideStory = ({
  step,
  stepIndex = 0,
  stepsCount = 6,
}: TutorialTooltipJoyrideStoryProps) => {
  const [run, setRun] = React.useState(false);

  React.useEffect(() => {
    setRun(true);
  }, []);

  const steps = React.useMemo(() => buildSteps(step, stepsCount), [step, stepsCount]);

  return (
    <div >
      <div>
        <Button id="tutorial-target" variant="secondary" size="sm">
          Tooltip Target
        </Button>
      </div>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous={true}
        showSkipButton={true}
        disableOverlay={true}
        scrollToFirstStep={false}
        styles={joyrideStyles}
        tooltipComponent={TutorialTooltip}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <TutorialTooltipJoyrideStory step={defaultStep} />,
};

export const LastStep: Story = {
  render: () => (
    <TutorialTooltipJoyrideStory step={defaultStep} stepIndex={5} stepsCount={6} />
  ),
};

export const EndOfPage: Story = {
  render: () => (
    <TutorialTooltipJoyrideStory
      step={{
        ...defaultStep,
        data: { isEndOfPage: true },
      }}
    />
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <TutorialTooltipJoyrideStory
      step={{
        ...defaultStep,
        title: undefined,
      }}
    />
  ),
};
