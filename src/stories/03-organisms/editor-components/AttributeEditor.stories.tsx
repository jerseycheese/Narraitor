import type { Meta, StoryObj } from '@storybook/react';
import { AttributeEditor } from '@/components/world/AttributeEditor/AttributeEditor';
import { EntityID } from '@/types/common.types';
import { action } from '@storybook/addon-actions';

const meta = {
  title: '03-Organisms/editor-components/AttributeEditor',
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
      <div>
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
};
