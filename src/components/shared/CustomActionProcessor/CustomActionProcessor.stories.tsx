import type { Meta, StoryObj } from '@storybook/react';
import CustomActionProcessor from './CustomActionProcessor';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof CustomActionProcessor> = {
  title: 'Narraitor/Shared/CustomActionProcessor',
  component: CustomActionProcessor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A component that processes custom player actions and detects implicit skill checks based on action verbs.',
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
    { id: '5', characterId: 'char1', name: 'Computer Use', level: 1, worldSkillId: 'computer-use' },
    { id: '6', characterId: 'char1', name: 'Investigation', level: 3, worldSkillId: 'investigation' },
  ]
};

const lowSkillCharacter = {
  skills: [
    { id: '1', characterId: 'char2', name: 'Intimidation', level: 1, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char2', name: 'Stealth', level: 1, worldSkillId: 'stealth' },
    { id: '3', characterId: 'char2', name: 'Charisma', level: 1, worldSkillId: 'charisma' },
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
        story: 'Default state showing the action input field. Try typing actions like "I intimidate the guard" or "I sneak past the enemy" to see skill checks appear.',
      },
    },
  },
};

export const WithHighSkillCharacter: Story = {
  args: {
    character: mockCharacter,
    onActionSubmit: action('onActionSubmit'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Character with high skills - most skill checks will succeed. Try: "I intimidate the guard" (level 4 vs 3), "I persuade the merchant" (level 5 vs 3).',
      },
    },
  },
};

export const WithLowSkillCharacter: Story = {
  args: {
    character: lowSkillCharacter,
    onActionSubmit: action('onActionSubmit'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Character with low skills - most skill checks will fail. Try the same actions to see red "unavailable" badges.',
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    character: mockCharacter,
    onActionSubmit: action('onActionSubmit'),
    placeholder: 'What do you want to do? (Skill checks will be automatically detected)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom placeholder text to guide player input.',
      },
    },
  },
};

export const WithClassName: Story = {
  args: {
    character: mockCharacter,
    onActionSubmit: action('onActionSubmit'),
    className: 'border-2 border-blue-200 p-4 rounded-lg bg-blue-50',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom styling applied to the component container.',
      },
    },
  },
};