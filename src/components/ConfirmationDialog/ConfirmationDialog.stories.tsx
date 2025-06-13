import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmationDialog } from './ConfirmationDialog';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'Narraitor/Dialogs/ConfirmationDialog',
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

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action? This action cannot be undone.',
  },
};

export const Destructive: Story = {
  args: {
    isOpen: true,
    title: 'Delete Character',
    message: 'Are you sure you want to delete this character? This action will permanently remove all character data and cannot be undone.',
    variant: 'destructive',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
};

export const Warning: Story = {
  args: {
    isOpen: true,
    title: 'Overwrite Save File',
    message: 'A save file already exists for this slot. Do you want to overwrite it with your current progress?',
    variant: 'warning',
    confirmText: 'Overwrite',
    cancelText: 'Choose Different Slot',
  },
};

export const Info: Story = {
  args: {
    isOpen: true,
    title: 'Start New Game',
    message: 'Starting a new game will create a fresh character and world. Your previous progress will remain saved separately.',
    variant: 'info',
    confirmText: 'Start New Game',
    cancelText: 'Continue Current Game',
  },
};

export const Loading: Story = {
  args: {
    isOpen: true,
    title: 'Saving Progress',
    message: 'Your game progress is being saved to the cloud. Please wait...',
    variant: 'default',
    isLoading: true,
    confirmText: 'Save',
    loadingText: 'Saving...',
  },
};

export const CustomLoadingText: Story = {
  args: {
    isOpen: true,
    title: 'Deleting World',
    message: 'This world and all associated data will be permanently deleted.',
    variant: 'destructive',
    isLoading: true,
    confirmText: 'Delete',
    loadingText: 'Deleting world...',
  },
};

export const WithoutTitle: Story = {
  args: {
    isOpen: true,
    message: 'Do you want to quit the current game session? Any unsaved progress will be lost.',
    confirmText: 'Quit',
    cancelText: 'Continue Playing',
  },
};

export const JSXMessage: Story = {
  args: {
    isOpen: true,
    title: 'Export Character Data',
    message: (
      <div className="space-y-3">
        <p>
          Your character data will be exported as a JSON file. This includes:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Character attributes and skills</li>
          <li>Inventory and equipment</li>
          <li>Quest progress and achievements</li>
          <li>Story choices and journal entries</li>
        </ul>
        <p className="text-sm text-gray-600">
          This file can be imported later or shared with other players.
        </p>
      </div>
    ),
    variant: 'info',
    confirmText: 'Export',
    cancelText: 'Cancel',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'This dialog is closed',
    message: 'You should not see this content when the dialog is closed.',
  },
};