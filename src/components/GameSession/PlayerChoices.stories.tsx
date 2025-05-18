import type { Meta, StoryObj } from '@storybook/react';
import PlayerChoices from './PlayerChoices';

const meta: Meta<typeof PlayerChoices> = {
  title: 'Narraitor/Game/PlayerChoices',
  component: PlayerChoices,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onChoiceSelected: { action: 'choice selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    choices: [
      { id: 'choice-1', text: 'Talk to the mysterious figure' },
      { id: 'choice-2', text: 'Order a drink from the bartender' },
      { id: 'choice-3', text: 'Leave the tavern quietly' },
    ],
  },
};

export const WithSelectedChoice: Story = {
  args: {
    choices: [
      { id: 'choice-1', text: 'Talk to the mysterious figure', isSelected: true },
      { id: 'choice-2', text: 'Order a drink from the bartender' },
      { id: 'choice-3', text: 'Leave the tavern quietly' },
    ],
  },
};

export const DisabledChoices: Story = {
  args: {
    choices: [
      { id: 'choice-1', text: 'Talk to the mysterious figure' },
      { id: 'choice-2', text: 'Order a drink from the bartender' },
    ],
    isDisabled: true,
  },
};

export const EmptyChoices: Story = {
  args: {
    choices: [],
  },
};

export const SingleChoice: Story = {
  args: {
    choices: [
      { id: 'choice-1', text: 'Continue your journey' },
    ],
  },
};

export const LongTextChoices: Story = {
  args: {
    choices: [
      { 
        id: 'choice-1', 
        text: 'Approach the mysterious figure cautiously, keeping your hand near your weapon but trying not to appear threatening' 
      },
      { 
        id: 'choice-2', 
        text: 'Order a strong drink from the bartender and casually ask about any recent rumors or strange occurrences in town' 
      },
      { 
        id: 'choice-3', 
        text: 'Slip out through the back door, avoiding any eye contact, and make your way to the stables' 
      },
    ],
  },
};