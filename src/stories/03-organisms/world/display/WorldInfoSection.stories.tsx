import type { Meta, StoryObj } from '@storybook/react';
import { WorldInfoSection } from '@/components/world/WorldInfoSection';
import { World } from '@/types/world.types';

const meta = {
  title: '03-Organisms/world/display/WorldInfoSection',
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
  genre: 'fantasy',
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
      relationship: 'set_within',
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
      genre: 'fantasy',
      relationship: 'inspired_by',
      reference: 'Star Wars',
    },
  },
};

export const LongReference: Story = {
  args: {
    world: {
      ...baseWorld,
      name: 'Extended Universe',
      relationship: 'inspired_by',
      reference: 'The Chronicles of Narnia, Lord of the Rings, and Harry Potter combined universe',
    },
  },
};
