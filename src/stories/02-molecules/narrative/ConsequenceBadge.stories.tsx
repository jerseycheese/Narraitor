// src/stories/02-molecules/narrative/ConsequenceBadge.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ConsequenceBadge } from '@/components/Narrative/ConsequenceBadge';

const meta: Meta<typeof ConsequenceBadge> = {
  title: '02-Molecules/narrative/ConsequenceBadge',
  component: ConsequenceBadge,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    distanceFromDecision: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description: 'Distance from decision determines immediate (0-2) vs longer-term (3+) appearance',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default consequence badge showing an immediate consequence (index 1)
 */
export const Default: Story = {
  args: {
    decisionId: 'decision-1',
    decisionText: 'You helped the merchant',
    distanceFromDecision: 1,
  },
};

/**
 * Immediate consequences (0-2 segments from decision) use info-static variant (blue)
 */
export const ImmediateConsequences: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Immediate Consequences (Index 0-2)
      </div>
      <ConsequenceBadge
        decisionId="decision-1"
        decisionText="You helped the merchant"
        distanceFromDecision={0}
      />
      <ConsequenceBadge
        decisionId="decision-2"
        decisionText="You investigated the noise"
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-3"
        decisionText="You attacked the enemy"
        distanceFromDecision={2}
      />
    </div>
  ),
};

/**
 * Longer-term consequences (3+ segments from decision) use secondary-static variant (gray)
 */
export const LongerTermConsequences: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Longer-term Consequences (Index 3+)
      </div>
      <ConsequenceBadge
        decisionId="decision-4"
        decisionText="You helped the merchant"
        distanceFromDecision={3}
      />
      <ConsequenceBadge
        decisionId="decision-5"
        decisionText="You investigated the noise"
        distanceFromDecision={5}
      />
      <ConsequenceBadge
        decisionId="decision-6"
        decisionText="You spared the enemy"
        distanceFromDecision={10}
      />
    </div>
  ),
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
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-2"
        decisionText="You attacked the bandit"
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-3"
        decisionText="You ran away quickly"
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-4"
        decisionText="You investigated the mysterious door"
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-5"
        decisionText="You convinced the guard to let you pass"
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-6"
        decisionText="You took the hidden treasure"
        distanceFromDecision={1}
      />
    </div>
  ),
};

/**
 * Demonstration showing how appearance changes based on segment index
 */
export const TransitionFromImmediateToLongerTerm: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg">
      <div className="text-sm font-semibold text-muted-foreground mb-2">
        Same Decision, Different Timing
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Index 0 (Immediate)</div>
        <ConsequenceBadge
          decisionId="decision-1"
          decisionText="You helped the merchant"
          distanceFromDecision={0}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Index 2 (Still Immediate)</div>
        <ConsequenceBadge
          decisionId="decision-1"
          decisionText="You helped the merchant"
          distanceFromDecision={2}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Index 3 (Longer-term)</div>
        <ConsequenceBadge
          decisionId="decision-1"
          decisionText="You helped the merchant"
          distanceFromDecision={3}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Index 7 (Longer-term)</div>
        <ConsequenceBadge
          decisionId="decision-1"
          decisionText="You helped the merchant"
          distanceFromDecision={7}
        />
      </div>
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
        distanceFromDecision={1}
      />
      <ConsequenceBadge
        decisionId="decision-2"
        decisionText="You investigated the mysterious noise coming from behind the old wooden door"
        distanceFromDecision={3}
      />
    </div>
  ),
};
