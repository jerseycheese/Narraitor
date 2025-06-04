import type { Meta, StoryObj } from '@storybook/react';
import { WorldInfoSection } from './WorldInfoSection';
import { World } from '@/types/world.types';

const meta = {
  title: 'Narraitor/World/Display/WorldInfoSection',
  component: WorldInfoSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldInfoSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock world data
const baseWorld: World = {
  id: 'world-1',
  name: 'Middle Earth',
  description: 'A fantasy world of magic and adventure',
  theme: 'Fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 27,
    skillPointPool: 15,
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

export const Default: Story = {
  args: {
    world: {
      ...baseWorld,
      relationship: 'set_in',
      reference: 'Lord of the Rings',
    },
  },
};

export const OriginalWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Aethermoor',
      description: 'An original fantasy realm',
      relationship: undefined,
    },
  },
};

export const SimilarToExisting: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'New Terra',
      description: 'A sci-fi colony world',
      theme: 'Sci-Fi',
      relationship: 'based_on',
      reference: 'Star Wars',
    },
  },
};

export const WithoutReference: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Mysterious Realm',
      relationship: undefined,
    },
  },
};

export const RecentlyCreated: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Brand New World',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relationship: undefined,
    },
  },
};

export const OldWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Ancient Realm',
      createdAt: '2020-01-15T08:30:00Z',
      updatedAt: '2024-11-20T15:45:00Z',
      relationship: 'set_in',
      reference: 'Dungeons & Dragons',
    },
  },
};

export const LongReference: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Extended Universe',
      relationship: 'based_on',
      reference: 'The Chronicles of Narnia, Lord of the Rings, and Harry Potter combined universe',
    },
  },
};

export const SciFiWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Cyberpunk City',
      description: 'A futuristic dystopian metropolis',
      theme: 'Cyberpunk',
      relationship: 'set_in',
      reference: 'Blade Runner',
      createdAt: '2024-12-01T12:00:00Z',
      updatedAt: '2024-12-02T18:30:00Z',
    },
  },
};

export const HorrorWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Shadows of Arkham',
      description: 'A town plagued by cosmic horrors',
      theme: 'Horror',
      relationship: 'based_on',
      reference: 'H.P. Lovecraft\'s Cthulhu Mythos',
      createdAt: '2024-10-31T23:59:00Z',
      updatedAt: '2024-11-01T00:15:00Z',
    },
  },
};

export const ModernWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Contemporary Earth',
      description: 'Modern day Earth with hidden supernatural elements',
      theme: 'Urban Fantasy',
      relationship: 'set_in',
      reference: 'World of Darkness',
      createdAt: '2024-12-03T09:00:00Z',
      updatedAt: '2024-12-03T10:00:00Z',
    },
  },
};
