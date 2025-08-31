import type { Meta, StoryObj } from '@storybook/react';
import CustomActionProcessor from '@/components/shared/CustomActionProcessor/CustomActionProcessor';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof CustomActionProcessor> = {
  title: '02-Molecules/devtools/CustomActionProcessor',
  component: CustomActionProcessor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A component that processes custom player actions and uses AI to detect relevant skill checks.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCharacter = {
  skills: [
    { id: '1', characterId: 'char1', name: 'Intimidation', level: 4, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char1', name: 'Stealth', level: 2, worldSkillId: 'stealth' },
    { id: '3', characterId: 'char1', name: 'Charisma', level: 5, worldSkillId: 'charisma' },
    { id: '4', characterId: 'char1', name: 'Athletics', level: 3, worldSkillId: 'athletics' },
    { id: '5', characterId: 'char1', name: 'Investigation', level: 3, worldSkillId: 'investigation' },
  ]
};

export const Default: Story = {
  args: {
    character: mockCharacter,
    onActionSubmit: action('onActionSubmit'),
    placeholder: 'Describe your action...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default component with AI-powered skill detection. Type natural actions like "I intimidate the guard" or "I sneak through the shadows" to see AI-detected skill checks.',
      },
    },
  },
};