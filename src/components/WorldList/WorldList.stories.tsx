import type { Meta, StoryObj } from '@storybook/react';
import WorldList from './WorldList';
import { World } from '../../types/world.types';

const meta = {
  title: 'Narraitor/World/WorldList',
  component: WorldList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a list of world cards'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldList>;

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
    onSelectWorld: () => alert('Select World'),
    onDeleteWorld: () => alert('Delete World'),
  },
};

export const Empty: Story = {
  args: {
    worlds: [],
    onSelectWorld: () => alert('Select World'),
    onDeleteWorld: () => alert('Delete World'),
  },
};
