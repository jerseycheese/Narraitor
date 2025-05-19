import type { Meta, StoryObj } from '@storybook/react';
import WorldAttributesForm from './WorldAttributesForm';
import { WorldAttribute } from '@/types/world.types';

const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    worldId: 'world-123',
    name: 'Strength',
    description: 'Physical power and muscle',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
    category: 'Physical',
  },
  {
    id: 'attr-2',
    worldId: 'world-123',
    name: 'Intelligence',
    description: 'Mental acuity and reasoning',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
    category: 'Mental',
  },
];

const meta: Meta<typeof WorldAttributesForm> = {
  title: 'Narraitor/World/Editor/WorldAttributesForm',
  component: WorldAttributesForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for managing world attributes with add, edit, and remove functionality',
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
        baseValue: 10,
        minValue: 1,
        maxValue: 20,
        category: 'Physical',
      },
      {
        id: 'attr-4',
        worldId: 'world-123',
        name: 'Wisdom',
        description: 'Insight and judgment',
        baseValue: 10,
        minValue: 1,
        maxValue: 20,
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