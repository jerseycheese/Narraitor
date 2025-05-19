import type { Meta, StoryObj } from '@storybook/react';
import WorldBasicInfoForm from './WorldBasicInfoForm';
import { World } from '@/types/world.types';

const mockWorld: World = {
  id: 'world-123',
  name: 'Fantasy Realm',
  description: 'A mystical world filled with magic and adventure',
  theme: 'High Fantasy',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 25,
    skillPointPool: 30,
  },
};

const meta: Meta<typeof WorldBasicInfoForm> = {
  title: 'Narraitor/World/Editor/WorldBasicInfoForm',
  component: WorldBasicInfoForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for editing basic world information including name, description, and theme',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldBasicInfoForm>;

export const Default: Story = {
  args: {
    world: mockWorld,
  },
};

export const EmptyWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: '',
      description: '',
      theme: '',
    },
  },
};

export const LongDescription: Story = {
  args: {
    world: {
      ...mockWorld,
      description: 'This is a very long description that demonstrates how the form handles extensive text content. It includes multiple paragraphs, detailed world-building information, and comprehensive lore that might be typical of a complex game world. The form should handle this gracefully with proper text wrapping and scrolling if necessary.',
    },
  },
};