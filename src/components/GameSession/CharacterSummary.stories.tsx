import type { Meta, StoryObj } from '@storybook/react';
import CharacterSummary from './CharacterSummary';

// Character type as used in characterStore
interface Character {
  id: string;
  name: string;
  worldId: string;
  level: number;
  description?: string;
  background?: {
    description: string;
    personality: string;
    motivation: string;
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

const meta = {
  title: 'Components/GameSession/CharacterSummary',
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
  description: 'A mysterious elf with a deep connection to nature',
  background: {
    description: 'Born under a full moon in the ancient forest of Eldoria, Elara was raised by druids who taught her the sacred ways of nature magic.',
    personality: 'Wise and mysterious, with a gentle spirit',
    motivation: 'Protect the natural world from corruption'
  },
  worldId: 'world-1',
  level: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  portrait: {
    type: 'ai-generated',
    url: 'https://via.placeholder.com/150'
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

export const PlaceholderPortrait: Story = {
  args: {
    character: {
      ...baseCharacter,
      portrait: { type: 'placeholder', url: null },
    },
  },
};

export const MinimalInfo: Story = {
  args: {
    character: {
      ...baseCharacter,
      description: undefined,
      background: undefined,
    },
  },
};

export const LongDescription: Story = {
  args: {
    character: {
      ...baseCharacter,
      description: 'A highly skilled warrior-mage who has mastered both the arcane arts and swordsmanship. Known throughout the lands for their incredible feats and legendary battles against the forces of darkness.',
      background: {
        description: 'Born into a noble family but chose the path of adventure after witnessing injustice. Trained at the Academy of High Magic for ten years before setting out on a quest to right the wrongs of the world. Has traveled to every corner of the realm, learning from masters of various disciplines and gathering allies for the fight against evil.',
        personality: 'Noble and courageous, with an unwavering sense of justice',
        motivation: 'Right the wrongs of the world and bring justice to all'
      },
    },
  },
};

export const HighLevel: Story = {
  args: {
    character: {
      ...baseCharacter,
      name: 'Thorin Ironforge',
      description: 'A legendary dwarven champion',
      level: 20,
    },
  },
};

export const MobileView: Story = {
  args: {
    character: baseCharacter,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};