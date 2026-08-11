import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptDecisionBlock } from '@/components/GameSession/ManuscriptDecisionBlock';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import type { Decision } from '@/types/narrative.types';
import React from 'react';

const DECISION: Decision = {
  id: 'decision-ruins',
  prompt: 'What do you do?',
  options: [
    { id: 'opt-1', text: 'Investigate the ruins before the light goes' },
    { id: 'opt-2', text: 'Talk to the merchant camped at the treeline' },
    { id: 'opt-3', text: 'Rest at the camp and start again at first light' },
  ],
  decisionWeight: 'minor',
};

/**
 * The decision reads as the closing paragraph of the current beat, so the
 * stories set it in a manuscript column with prose above it rather than
 * against a bare canvas — a docked panel would look fine on its own and
 * still be the wrong shape.
 */
const meta: Meta<typeof ManuscriptDecisionBlock> = {
  title: '03-Organisms/Game Session/ManuscriptDecisionBlock',
  component: ManuscriptDecisionBlock,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="manuscript-viewport-layer manuscript-decision-block-story">
        <div className="manuscript-viewport-shell">
          <div className="manuscript-main-content">
            <div className="manuscript-main-content-inner">
              <p className="narrative-segment">
                The path down to the ruins is half swallowed by roots, and the
                light is going faster than you would like. Somewhere below, water
                is moving.
              </p>
              <Story />
            </div>
          </div>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManuscriptDecisionBlock>;

export const Default: Story = {
  args: {
    children: (
      <ChoiceSelector
        decision={DECISION}
        onSelect={() => {}}
        enableCustomInput
        onCustomSubmit={() => {}}
      />
    ),
  },
};

/** Choices and composer are locked while the next beat generates. */
export const Streaming: Story = {
  args: {
    isStreaming: true,
    children: (
      <ChoiceSelector
        decision={DECISION}
        onSelect={() => {}}
        enableCustomInput
        onCustomSubmit={() => {}}
        isDisabled
      />
    ),
  },
};
