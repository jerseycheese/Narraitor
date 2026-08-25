// src/stories/02-molecules/narrative/ChoiceOutcomeCallout.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { ChoiceOutcomeCallout } from '@/components/Narrative/ChoiceOutcomeCallout';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useNPCStore } from '@/state/npcStore';

const meta: Meta<typeof ChoiceOutcomeCallout> = {
  title: '02-Molecules/narrative/ChoiceOutcomeCallout',
  component: ChoiceOutcomeCallout,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        // Rendered without a .narrative-history-container ancestor, so the
        // :has() scoping keeps the component in-flow. This canvas shows the
        // card presentation used below 1280px. Left-gutter mark placement at
        // >=1280px is covered by the geometry assertions in
        // manuscript-regression-assertions.spec.ts.
        component:
          'Renders in the card form used below 1280px. Left-gutter mark placement at >=1280px is covered by the geometry assertions in manuscript-regression-assertions.spec.ts.',
      },
    },
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

/**
 * Structured consequence chips (#468): the chosen option carried a trust
 * delta and an alignment shift, surfaced under the decision text. Seeds the
 * narrative + NPC stores so the callout can resolve them.
 */
function ConsequencesHarness() {
  const [seeded, setSeeded] = useState(false);
  const iso = '2026-01-01T12:00:00.000Z';

  useEffect(() => {
    useNPCStore.setState({
      npcs: {
        'sb-npc-marta': { id: 'sb-npc-marta', name: 'Marta', description: '', worldId: 'sb-demo-world', createdAt: iso, updatedAt: iso },
      },
    });
    useNarrativeStore.setState({
      decisions: {
        'sb-decision-consequences': {
          id: 'sb-decision-consequences',
          prompt: 'What do you do with the ledger?',
          selectedOptionId: 'sb-opt-1',
          options: [
            {
              id: 'sb-opt-1',
              text: 'Pocket the ledger while Marta is distracted',
              alignment: 'chaotic',
              consequences: [
                { type: 'relationship', action: 'modify', targetId: 'sb-npc-marta', value: { trustDelta: -15 } },
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: -8 },
              ],
            },
          ],
        },
      },
    });
    setSeeded(true);
  }, []);

  if (!seeded) return null;

  return (
    <ChoiceOutcomeCallout
      decisionId="sb-decision-consequences"
      decisionText="You choose to pocket the ledger while Marta is distracted"
      decisionOutcome="success"
    />
  );
}

export const WithConsequences: Story = {
  render: () => <ConsequencesHarness />,
};
