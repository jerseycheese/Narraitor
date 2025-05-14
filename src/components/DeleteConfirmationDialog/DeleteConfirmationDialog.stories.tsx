import type { Meta, StoryObj } from '@storybook/react';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const meta = {
  title: 'Narraitor/Common/DeleteConfirmationDialog',
  component: DeleteConfirmationDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal dialog for confirming deletion actions'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteConfirmationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Dialog closed'),
    onConfirm: () => alert('Confirmed deletion'),
    message: 'Are you sure you want to delete this item?',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => alert('Dialog closed'),
    onConfirm: () => alert('Confirmed deletion'),
    message: 'Are you sure you want to delete this item?',
  },
};
