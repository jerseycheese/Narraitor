import type { Meta, StoryObj } from '@storybook/react';
import MockWorldList from './MockWorldList';
import { World } from '../../types/world.types';

// Using the MockWorldList component instead of the real WorldList
// This avoids Next.js router issues in Storybook
const meta = {
  title: 'Narraitor/World/WorldList',
  component: MockWorldList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a list of world cards'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockWorldList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockWorlds: World[] = [
  { 
    id: '1', 
    name: 'World 1', 
    description: 'Desc 1', 
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  { 
    id: '2', 
    name: 'World 2', 
    description: 'Desc 2', 
    theme: 'Sci-Fi',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-02T10:00:00Z',
    updatedAt: '2023-01-02T10:00:00Z',
  },
];

export const Default: Story = {
  args: {
    worlds: mockWorlds,
    onSelectWorld: (id) => console.log(`Selected world: ${id}`),
    onDeleteWorld: (id) => console.log(`Delete world: ${id}`),
    onPlayWorld: (id) => console.log(`Play world: ${id}`),
  },
};

export const Empty: Story = {
  args: {
    worlds: [],
    onSelectWorld: (id) => console.log(`Selected world: ${id}`),
    onDeleteWorld: (id) => console.log(`Delete world: ${id}`),
    onPlayWorld: (id) => console.log(`Play world: ${id}`),
  },
};

// Add a story that demonstrates the Play functionality
export const WithPlayAction: Story = {
  args: {
    worlds: [mockWorlds[0]], // Just use one world for clarity
    onSelectWorld: (id) => console.log(`Selected world: ${id}`),
    onDeleteWorld: (id) => console.log(`Delete world: ${id}`),
    onPlayWorld: (id) => {
      console.log(`Play world: ${id}`);
      console.log(`[Storybook] Would navigate to: /world/${id}/play`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the Play button functionality for worlds'
      }
    }
  },
};