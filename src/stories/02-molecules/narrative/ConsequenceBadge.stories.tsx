// src/stories/02-molecules/narrative/ConsequenceBadge.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ConsequenceBadge } from '@/components/Narrative/ConsequenceBadge';

const meta: Meta<typeof ConsequenceBadge> = {
  title: '02-Molecules/narrative/ConsequenceBadge',
  component: ConsequenceBadge,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default consequence badge
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
      <ConsequenceBadge
        decisionId="decision-1"
        decisionText="You helped the merchant"
      />
      <ConsequenceBadge
        decisionId="decision-2"
        decisionText="You attacked the bandit"
      />
      <ConsequenceBadge
        decisionId="decision-3"
        decisionText="You ran away quickly"
      />
      <ConsequenceBadge
        decisionId="decision-4"
        decisionText="You investigated the mysterious door"
      />
      <ConsequenceBadge
        decisionId="decision-5"
        decisionText="You convinced the guard to let you pass"
      />
      <ConsequenceBadge
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
      <ConsequenceBadge
        decisionId="decision-1"
        decisionText="You helped the merchant"
      />
      <ConsequenceBadge
        decisionId="decision-2"
        decisionText="You investigated the mysterious noise coming from behind the old wooden door"
      />
    </div>
  ),
};
