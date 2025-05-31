import type { Meta, StoryObj } from '@storybook/react';
import ChoiceSelector from './ChoiceSelector';
import { Decision } from '@/types/narrative.types';

const meta: Meta<typeof ChoiceSelector> = {
  title: 'Narraitor/Shared/ChoiceSelector',
  component: ChoiceSelector,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSelect: { action: 'choice selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;


// Decision with hints
const decisionWithHints: Decision = {
  id: 'decision-1',
  prompt: 'You encounter a locked door. How do you proceed?',
  options: [
    {
      id: 'opt-1',
      text: 'Pick the lock',
      hint: 'Requires Lockpicking skill',
    },
    {
      id: 'opt-2',
      text: 'Force the door open',
      hint: 'Requires high Strength',
    },
    {
      id: 'opt-3',
      text: 'Look for another way',
      hint: 'Safe but time-consuming',
    },
  ],
};

// Main implementation story - Decision with Hints and Custom Input
export const DecisionWithCustomInput: Story = {
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

// Alternative prompt for variety
export const CombatDecision: Story = {
  args: {
    decision: {
      id: 'combat-decision',
      prompt: 'A bandit jumps out from behind the trees, sword drawn. What do you do?',
      options: [
        {
          id: 'fight',
          text: 'Draw your weapon and fight',
          hint: 'Direct confrontation - requires combat skills',
        },
        {
          id: 'dodge',
          text: 'Duck and roll to avoid the attack',
          hint: 'Defensive maneuver - requires agility',
        },
        {
          id: 'negotiate',
          text: 'Try to talk your way out',
          hint: 'Peaceful approach - requires charisma',
        },
      ],
    },
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

// Disabled state for testing
export const DisabledState: Story = {
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
    isDisabled: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};