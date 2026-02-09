// src/stories/02-molecules/narrative/ChoiceOutcomeCallout.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ChoiceOutcomeCallout } from '@/components/Narrative/ChoiceOutcomeCallout';

const meta: Meta<typeof ChoiceOutcomeCallout> = {
  title: '02-Molecules/narrative/ChoiceOutcomeCallout',
  component: ChoiceOutcomeCallout,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default choice outcome callout
 */
export const Default: Story = {
  args: {
    decisionId: 'decision-1',
    decisionText: 'You choose to help the merchant',
  },
};

/**
 * Example of various decision texts with different actions
 */
export const VariousDecisionTexts: Story = {
  render: () => (
    <div>
      <div>
        Various Decision Types
      </div>
      <ChoiceOutcomeCallout
        decisionId="decision-1"
        decisionText="You choose to help the merchant"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-2"
        decisionText="You choose to attack the bandit"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-3"
        decisionText="You choose to run away quickly"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-4"
        decisionText="You choose to investigate the mysterious door"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-5"
        decisionText="You choose to convince the guard to let you pass"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-6"
        decisionText="You choose to take the treasure"
      />
    </div>
  ),
};

/**
 * Mobile view demonstration - badges remain readable on narrow screens
 */
export const MobileView: Story = {
  render: () => (
    <div>
      <div>
        Mobile View (375px width)
      </div>
      <ChoiceOutcomeCallout
        decisionId="decision-1"
        decisionText="You choose to help the merchant"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-2"
        decisionText="You choose to investigate the mysterious noise coming from behind the old wooden door"
      />
    </div>
  ),
};

export const WithOutcome: Story = {
  args: {
    decisionId: 'decision-7',
    decisionText: 'You choose to slip past the guards',
    decisionOutcome: 'success',
  },
};
