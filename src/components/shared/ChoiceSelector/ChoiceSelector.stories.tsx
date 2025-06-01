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

// Simple choices data (kept for potential future use)
// const simpleChoices = [
//   { id: 'choice-1', text: 'Enter the mysterious cave' },
//   { id: 'choice-2', text: 'Continue along the path' },
//   { id: 'choice-3', text: 'Set up camp for the night' },
// ];

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

export const BasicChoices: Story = {
  args: {
    decision: decisionWithHints,
  },
};

export const WithCustomInput: Story = {
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the custom input field displayed above the choice options by default when enabled.',
      },
    },
  },
};

// === ALIGNMENT STORIES ===
// Mock aligned decision for alignment testing
const createAlignedDecision = (): Decision => ({
  id: 'mock-decision-aligned',
  prompt: 'You encounter a group of bandits blocking the road ahead. What will you do?',
  options: [
    {
      id: 'option-lawful',
      text: 'Approach peacefully and try to negotiate passage',
      alignment: 'lawful',
      hint: 'Respects authority and seeks peaceful resolution'
    },
    {
      id: 'option-neutral-1', 
      text: 'Assess the situation and look for alternative routes',
      alignment: 'neutral',
      hint: 'Practical approach to the problem'
    },
    {
      id: 'option-neutral-2',
      text: 'Wait and observe their behavior before acting',
      alignment: 'neutral',
      hint: 'Balanced and cautious response'
    },
    {
      id: 'option-chaotic',
      text: 'Start loudly singing an epic ballad about bandit fashion choices',
      alignment: 'chaotic',
      hint: 'Wildly unexpected action that completely changes the situation'
    }
  ]
});

// Removed mixedAlignmentDecision - using createAlignedDecision for all alignment testing

export const AlignedChoices: Story = {
  args: {
    decision: createAlignedDecision(),
    showHints: true,
  },
};

export const AlignedChoicesWithCustomInput: Story = {
  args: {
    decision: createAlignedDecision(),
    enableCustomInput: true,
    showHints: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows aligned choices with custom input field displayed above for immediate use.',
      },
    },
  },
};

// Removed MixedAlignment story - redundant with AlignedChoices

