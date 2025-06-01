import type { Meta, StoryObj } from '@storybook/react';
import ChoiceSelector from './ChoiceSelector';
import { Decision } from '@/types/narrative.types';

const meta: Meta<typeof ChoiceSelector> = {
  title: 'Narraitor/Game/ChoiceSelector/Alignment',
  component: ChoiceSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Choice selector component demonstrating lawful/chaos alignment styling for player choices.',
      },
    },
  },
  argTypes: {
    onSelect: { action: 'choice selected' },
    onCustomSubmit: { action: 'custom choice submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock aligned decision for stories
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
      id: 'option-chaos',
      text: 'Create a loud distraction and rush past them',
      alignment: 'chaos',
      hint: 'Unexpected and disruptive action'
    }
  ]
});

const mixedAlignmentDecision: Decision = {
  id: 'mock-decision-mixed',
  prompt: 'A merchant offers you a suspiciously good deal. What will you do?',
  options: [
    {
      id: 'option-lawful-2',
      text: 'Report the suspicious merchant to the authorities',
      alignment: 'lawful'
    },
    {
      id: 'option-neutral-3',
      text: 'Politely decline and walk away',
      alignment: 'neutral'
    },
    {
      id: 'option-chaos-2', 
      text: 'Accept the deal and see what chaos follows',
      alignment: 'chaos'
    }
  ]
};

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
  },
};

export const MixedAlignment: Story = {
  args: {
    decision: mixedAlignmentDecision,
    showHints: false,
  },
};

// Removed trivial stories - keeping only essential alignment demonstrations

export const DisabledAlignedChoices: Story = {
  args: {
    decision: createAlignedDecision(),
    isDisabled: true,
    showHints: true,
  },
};

// Removed LongTextAlignment story - not essential for alignment verification