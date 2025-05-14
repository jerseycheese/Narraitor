import type { Meta, StoryObj } from '@storybook/react';
import WorldCard from './WorldCard';
import { World } from '../../types/world.types';

const meta = {
  title: 'Narraitor/World/WorldCard',
  component: WorldCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays individual world information with action buttons'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockWorld: World = {
  id: '1',
  name: 'Test World',
  description: 'This is a test world.',
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
};

export const Default: Story = {
  args: {
    world: mockWorld,
    onSelect: () => alert('World Selected'),
    onDelete: () => alert('Delete World'),
  },
};
