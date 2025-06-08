import type { Meta, StoryObj } from '@storybook/react';
import CharacterSummary from './CharacterSummary';

// Character type as used in characterStore
interface Character {
  id: string;
  name: string;
  worldId: string;
  level: number;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    physicalDescription?: string;
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

const meta = {
  title: 'Narraitor/Game/Session/CharacterSummary',
  component: CharacterSummary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    character: {
      description: 'The character object to display',
    },
  },
} satisfies Meta<typeof CharacterSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseCharacter: Character = {
  id: 'char-1',
  name: 'Elara Moonwhisper',
  background: {
    history: 'Born under a full moon in the ancient forest of Eldoria, Elara was raised by druids who taught her the sacred ways of nature magic.',
    personality: 'Wise and mysterious, with a gentle spirit',
    goals: ['Protect the natural world from corruption'],
    fears: ['Dark magic', 'Forest destruction'],
    physicalDescription: 'Tall elf with silver hair and green eyes'
  },
  worldId: 'world-1',
  level: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  portrait: {
    type: 'ai-generated',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijc1IiB5PSI3NSIgc3R5bGU9ImZpbGw6I2FhYTtmb250LXdlaWdodDpib2xkO2ZvbnQtc2l6ZToxOHB4O2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO2RvbWluYW50LWJhc2VsaW5lOmNlbnRyYWwiPjE1MHgxNTA8L3RleHQ+PC9zdmc+'
  }
};

export const Default: Story = {
  args: {
    character: baseCharacter,
  },
};

export const WithoutPortrait: Story = {
  args: {
    character: {
      ...baseCharacter,
      portrait: undefined,
    },
  },
};

export const WithPlaceholderPortrait: Story = {
  args: {
    character: {
      ...baseCharacter,
      portrait: {
        type: 'placeholder',
        url: null,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Character with placeholder portrait - shows initials-based fallback'
      }
    }
  }
};

