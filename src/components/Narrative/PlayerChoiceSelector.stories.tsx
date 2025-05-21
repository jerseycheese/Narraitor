import type { Meta, StoryObj } from '@storybook/react';
import PlayerChoiceSelector from './PlayerChoiceSelector';
import { Decision } from '@/types/narrative.types';

const meta: Meta<typeof PlayerChoiceSelector> = {
  title: 'Narraitor/Narrative/PlayerChoiceSelector',
  component: PlayerChoiceSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlayerChoiceSelector>;

// Mock decisions for different story variants
const basicDecision: Decision = {
  id: 'decision-1',
  prompt: 'What will you do at the crossroads?',
  options: [
    { id: 'option-1', text: 'Take the path to the mountains' },
    { id: 'option-2', text: 'Follow the river downstream' },
    { id: 'option-3', text: 'Enter the dark forest' },
  ],
};

const decisionWithHints: Decision = {
  id: 'decision-2',
  prompt: 'How will you approach the guard?',
  options: [
    { 
      id: 'option-1', 
      text: 'Use stealth to sneak past', 
      hint: 'Requires good dexterity' 
    },
    { 
      id: 'option-2', 
      text: 'Bribe the guard', 
      hint: 'Costs 50 gold' 
    },
    { 
      id: 'option-3', 
      text: 'Bluff your way through', 
      hint: 'Requires charisma' 
    },
  ],
};

const selectedOptionDecision: Decision = {
  id: 'decision-3',
  prompt: 'How will you escape the dungeon?',
  options: [
    { id: 'option-1', text: 'Pick the lock' },
    { id: 'option-2', text: 'Overpower the guard' },
    { id: 'option-3', text: 'Wait for rescue' },
  ],
  selectedOptionId: 'option-2',
};

const manyOptionsDecision: Decision = {
  id: 'decision-4',
  prompt: 'Choose your next action:',
  options: [
    { id: 'option-1', text: 'Investigate the strange artifact' },
    { id: 'option-2', text: 'Speak with the village elder' },
    { id: 'option-3', text: 'Rest at the inn' },
    { id: 'option-4', text: 'Visit the marketplace' },
    { id: 'option-5', text: 'Leave town' },
  ],
};

export const Basic: Story = {
  args: {
    decision: basicDecision,
    onSelect: (optionId) => console.log(`Selected option: ${optionId}`),
  },
};

export const WithHints: Story = {
  args: {
    decision: decisionWithHints,
    onSelect: (optionId) => console.log(`Selected option: ${optionId}`),
  },
};

export const WithSelectedOption: Story = {
  args: {
    decision: selectedOptionDecision,
    onSelect: (optionId) => console.log(`Selected option: ${optionId}`),
  },
};

export const ManyOptions: Story = {
  args: {
    decision: manyOptionsDecision,
    onSelect: (optionId) => console.log(`Selected option: ${optionId}`),
  },
};

export const Disabled: Story = {
  args: {
    decision: basicDecision,
    onSelect: (optionId) => console.log(`Selected option: ${optionId}`),
    isDisabled: true,
  },
};