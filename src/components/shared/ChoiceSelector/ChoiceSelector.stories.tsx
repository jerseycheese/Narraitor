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

// Simple choices data
const simpleChoices = [
  { id: 'choice-1', text: 'Enter the mysterious cave' },
  { id: 'choice-2', text: 'Continue along the path' },
  { id: 'choice-3', text: 'Set up camp for the night' },
];

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

export const SimpleChoices: Story = {
  args: {
    choices: simpleChoices,
  },
};

export const DecisionWithHints: Story = {
  args: {
    decision: decisionWithHints,
  },
};

export const WithSelection: Story = {
  args: {
    decision: {
      ...decisionWithHints,
      selectedOptionId: 'opt-2',
    },
  },
};

export const Disabled: Story = {
  args: {
    choices: simpleChoices,
    isDisabled: true,
  },
};

export const WithCustomInput: Story = {
  args: {
    choices: simpleChoices,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

export const CustomInputActive: Story = {
  args: {
    choices: simpleChoices,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

export const CustomInputWithPlaceholder: Story = {
  args: {
    choices: simpleChoices,
    enableCustomInput: true,
    customInputPlaceholder: 'Describe your action in detail...',
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

export const CustomInputWithLimit: Story = {
  args: {
    choices: simpleChoices,
    enableCustomInput: true,
    maxCustomLength: 100,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

export const DecisionWithCustomInput: Story = {
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};

export const DisabledWithCustomInput: Story = {
  args: {
    choices: simpleChoices,
    enableCustomInput: true,
    isDisabled: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
};