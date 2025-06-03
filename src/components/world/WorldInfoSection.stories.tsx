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
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

export const Default: Story = {
  args: {
    world: {
      ...baseWorld,
      relationship: 'set_in_existing_world',
      worldReference: 'Lord of the Rings',
    },
  },
};

export const OriginalWorld: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Aethermoor',
      description: 'An original fantasy realm',
      relationship: 'original_world',
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
      relationship: 'similar_to_existing',
      worldReference: 'Star Wars',
    },
  },
};

export const WithoutReference: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Mysterious Realm',
      relationship: 'original_world',
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
      relationship: 'original_world',
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
      relationship: 'set_in_existing_world',
      worldReference: 'Dungeons & Dragons',
    },
  },
};

export const LongReference: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Extended Universe',
      relationship: 'similar_to_existing',
      worldReference: 'The Chronicles of Narnia, Lord of the Rings, and Harry Potter combined universe',
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
      relationship: 'set_in_existing_world',
      worldReference: 'Blade Runner',
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
      relationship: 'similar_to_existing',
      worldReference: 'H.P. Lovecraft\'s Cthulhu Mythos',
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
      relationship: 'set_in_existing_world',
      worldReference: 'World of Darkness',
      createdAt: '2024-12-03T09:00:00Z',
      updatedAt: '2024-12-03T10:00:00Z',
    },
  },
};