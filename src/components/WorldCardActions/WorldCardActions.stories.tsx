import type { Meta, StoryObj } from '@storybook/react';
import WorldCardActions from './WorldCardActions';

const meta = {
  title: 'Narraitor/World/Display/WorldCardActions',
  component: WorldCardActions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Action buttons for world cards (Play, Edit, Delete)'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldCardActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onPlay: () => alert('Play clicked'),
    onEdit: () => alert('Edit clicked'),
    onDelete: () => alert('Delete clicked'),
  },
};
