import type { Meta, StoryObj } from '@storybook/react';
import { PrioritizationSettings } from './PrioritizationSettings';

export default {
  title: 'Narraitor/Context/PrioritizationSettings',
  component: PrioritizationSettings,
  parameters: {
    docs: {
      description: {
        component: 'Configure context prioritization weights'
      }
    }
  }
} as Meta<typeof PrioritizationSettings>;

type Story = StoryObj<typeof PrioritizationSettings>;

export const Default: Story = {
  args: {
    defaultWeights: {
      'character.current_state': 5,
      'character.attributes': 4,
      'world.rules': 3,
      'world.description': 2,
      'events.recent': 4,
      'events.historical': 1
    },
    onChange: (weights) => console.log('Updated weights:', weights)
  }
};

export const CustomPresets: Story = {
  args: {
    presets: [
      { name: 'Combat Heavy', weights: { 'character.attributes': 5, 'character.skills': 5 } },
      { name: 'Story Focused', weights: { 'events.recent': 5, 'world.description': 4 } }
    ]
  }
};

export const ReadOnly: Story = {
  args: {
    defaultWeights: {
      'character.current_state': 5,
      'character.attributes': 4,
      'world.rules': 3
    },
    readOnly: true
  }
};
