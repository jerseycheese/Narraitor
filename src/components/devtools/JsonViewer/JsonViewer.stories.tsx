import type { Meta, StoryObj } from '@storybook/react';
import { JsonViewer } from './JsonViewer';

const meta: Meta<typeof JsonViewer> = {
  title: 'Narraitor/DevTools/JsonViewer',
  component: JsonViewer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for displaying JSON data in a formatted way'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'The data to display'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names'
    }
  }
};

export default meta;
type Story = StoryObj<typeof JsonViewer>;

export const GameStateData: Story = {
  args: {
    data: {
      worldId: 'fantasy-realm-1',
      characterId: 'hero-001',
      currentLocation: 'Dragon\'s Lair',
      inventory: {
        items: [
          { id: 'sword-001', name: 'Enchanted Blade', quantity: 1 },
          { id: 'potion-health', name: 'Health Potion', quantity: 3 }
        ],
        capacity: 20
      },
      stats: {
        health: 85,
        mana: 42,
        experience: 1250
      },
      questLog: ['Slay the Dragon', 'Find the Ancient Artifact']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays game state data as it would appear in DevTools for debugging narrative progression.'
      }
    }
  }
};

export const NarrativeContext: Story = {
  args: {
    data: {
      recentSegments: ['segment-1', 'segment-2', 'segment-3'],
      activeCharacters: ['hero-001', 'wizard-002'],
      currentLocation: 'Mystic Forest',
      activeQuests: ['quest-dragon', 'quest-artifact'],
      mood: 'tense',
      choices: [
        'Attack the dragon directly',
        'Use stealth to sneak past',
        'Cast a protection spell'
      ]
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows narrative context data used by the AI for generating story content.'
      }
    }
  }
};