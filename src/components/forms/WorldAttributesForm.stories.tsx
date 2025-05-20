import type { Meta, StoryObj } from '@storybook/react';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import { WorldAttribute } from '@/types/world.types';

// Updated to use 1-10 range for MVP
const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    worldId: 'world-123',
    name: 'Strength',
    description: 'Physical power and muscle',
    baseValue: 7,
    minValue: 1,
    maxValue: 10,
    category: 'Physical',
  },
  {
    id: 'attr-2',
    worldId: 'world-123',
    name: 'Intelligence',
    description: 'Mental acuity and reasoning',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
    category: 'Mental',
  },
];

const meta: Meta<typeof WorldAttributesForm> = {
  title: 'Narraitor/Forms/WorldAttributesForm',
  component: WorldAttributesForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for managing world attributes with add, edit, and remove functionality. Includes range controls for setting attribute default values.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldAttributesForm>;

export const Default: Story = {
  args: {
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const Empty: Story = {
  args: {
    attributes: [],
    worldId: 'world-123',
  },
};

export const SingleAttribute: Story = {
  args: {
    attributes: [mockAttributes[0]],
    worldId: 'world-123',
  },
};

export const ManyAttributes: Story = {
  args: {
    attributes: [
      ...mockAttributes,
      {
        id: 'attr-3',
        worldId: 'world-123',
        name: 'Agility',
        description: 'Speed and dexterity',
        baseValue: 3,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      },
      {
        id: 'attr-4',
        worldId: 'world-123',
        name: 'Wisdom',
        description: 'Insight and judgment',
        baseValue: 9,
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
      },
    ],
    worldId: 'world-123',
  },
};

export const WithoutCategories: Story = {
  args: {
    attributes: mockAttributes.map(attr => ({
      ...attr,
      category: undefined,
    })),
    worldId: 'world-123',
  },
};

export const WithDifferentDefaultValues: Story = {
  args: {
    attributes: [
      {
        id: 'attr-1',
        worldId: 'world-123',
        name: 'Strength',
        description: 'Physical power and muscle',
        baseValue: 8,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      },
      {
        id: 'attr-2',
        worldId: 'world-123',
        name: 'Intelligence',
        description: 'Mental acuity and reasoning',
        baseValue: 9,
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
      },
      {
        id: 'attr-3',
        worldId: 'world-123',
        name: 'Charisma',
        description: 'Social appeal and leadership',
        baseValue: 2,
        minValue: 1,
        maxValue: 10,
        category: 'Social',
      },
      {
        id: 'attr-4',
        worldId: 'world-123',
        name: 'Luck',
        description: 'Random chance and fortune',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      },
    ],
    worldId: 'world-123',
  },
};