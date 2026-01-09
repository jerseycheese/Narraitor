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
    decisionText: 'You helped the merchant',
  },
};

/**
 * Example of various decision texts with different actions
 */
export const VariousDecisionTexts: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg max-w-md">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Various Decision Types
      </div>
      <ChoiceOutcomeCallout
        decisionId="decision-1"
        decisionText="You helped the merchant"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-2"
        decisionText="You attacked the bandit"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-3"
        decisionText="You ran away quickly"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-4"
        decisionText="You investigated the mysterious door"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-5"
        decisionText="You convinced the guard to let you pass"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-6"
        decisionText="You took the hidden treasure"
      />
    </div>
  ),
};

/**
 * Mobile view demonstration - badges remain readable on narrow screens
 */
export const MobileView: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg max-w-[375px]">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Mobile View (375px width)
      </div>
      <ChoiceOutcomeCallout
        decisionId="decision-1"
        decisionText="You helped the merchant"
      />
      <ChoiceOutcomeCallout
        decisionId="decision-2"
        decisionText="You investigated the mysterious noise coming from behind the old wooden door"
      />
    </div>
  ),
};

export const WithOutcome: Story = {
  args: {
    decisionId: 'decision-7',
    decisionText: 'You slipped past the guards',
    decisionOutcome: 'success',
  },
};
