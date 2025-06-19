import type { Meta, StoryObj } from '@storybook/react';
import { AttributeEditor } from './AttributeEditor';
import { EntityID } from '@/types/common.types';
import { action } from '@storybook/addon-actions';

const meta = {
  title: 'Narraitor/World/Edit/AttributeEditor',
  component: AttributeEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttributeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock world data for stories
const mockWorldId = 'world-123' as EntityID;
const mockAttributeId = 'attr-123' as EntityID;

export const CreateMode: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
  },
};

export const EditMode: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'edit',
    attributeId: mockAttributeId,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onCancel: action('onCancel'),
  },
  parameters: {
    mockData: {
      world: {
        id: mockWorldId,
        attributes: {
          [mockAttributeId]: {
            id: mockAttributeId,
            name: 'Strength',
            description: 'Physical power and endurance',
            minValue: 1,
            maxValue: 10,
          },
        },
        skills: {},
      },
    },
  },
};

export const EditWithLinkedSkills: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'edit',
    attributeId: mockAttributeId,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onCancel: action('onCancel'),
  },
  parameters: {
    mockData: {
      world: {
        id: mockWorldId,
        attributes: {
          [mockAttributeId]: {
            id: mockAttributeId,
            name: 'Intelligence',
            description: 'Mental acuity and problem-solving ability',
            minValue: 1,
            maxValue: 20,
          },
        },
        skills: {
          'skill-1': {
            id: 'skill-1' as EntityID,
            name: 'Investigation',
            description: 'Finding clues and solving mysteries',
            linkedAttribute: mockAttributeId,
            difficulty: 'medium',
          },
          'skill-2': {
            id: 'skill-2' as EntityID,
            name: 'Arcana',
            description: 'Knowledge of magic and the supernatural',
            linkedAttribute: mockAttributeId,
            difficulty: 'hard',
          },
          'skill-3': {
            id: 'skill-3' as EntityID,
            name: 'History',
            description: 'Knowledge of past events',
            linkedAttribute: mockAttributeId,
            difficulty: 'easy',
          },
        },
      },
    },
  },
};

