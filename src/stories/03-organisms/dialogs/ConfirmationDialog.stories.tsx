import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

const meta: Meta<typeof ConfirmationDialog> = {
  title: '03-Organisms/dialogs/ConfirmationDialog',
  component: ConfirmationDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A confirmation dialog for important actions with different variants for various use cases.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the dialog is open or closed',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'info'],
      description: 'The variant affects styling and focus behavior',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading state on buttons',
    },
    onClose: { action: 'closed' },
    onConfirm: { action: 'confirmed' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteCharacter: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/ConfirmationDialog',
    message: 'Are you sure you want to delete this character? This action will permanently remove all character data and cannot be undone.',
    variant: 'destructive',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
};

export const DeleteWorld: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/ConfirmationDialog',
    message: 'Are you sure you want to delete this world? This will permanently remove the world and all associated characters and stories.',
    variant: 'destructive',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
};

export const EndSession: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/ConfirmationDialog',
    message: 'Are you sure you want to end this narrative session? Your progress will be saved automatically.',
    variant: 'warning',
    confirmText: 'End Session',
    cancelText: 'Continue Playing',
  },
};