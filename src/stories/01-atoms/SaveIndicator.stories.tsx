/**
 * Storybook stories for SaveIndicator component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SaveIndicator } from './SaveIndicator';

const meta: Meta<typeof SaveIndicator> = {
  title: 'Narraitor/UI/SaveIndicator',
  component: SaveIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays auto-save status and provides manual save controls for game sessions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'saving', 'saved', 'error'],
      description: 'Current auto-save status',
    },
    lastSaveTime: {
      control: 'text',
      description: 'ISO timestamp of last successful save',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message when status is error',
    },
    totalSaves: {
      control: 'number',
      description: 'Total number of saves performed',
    },
    onManualSave: {
      description: 'Callback when manual save is triggered',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: 'idle',
    totalSaves: 0,
  },
};

export const Saving: Story = {
  args: {
    status: 'saving',
    totalSaves: 3,
  },
};

export const Saved: Story = {
  args: {
    status: 'saved',
    lastSaveTime: new Date().toISOString(),
    totalSaves: 5,
  },
};

export const SavedWithTimestamp: Story = {
  args: {
    status: 'saved',
    lastSaveTime: '2023-01-01T14:30:00.000Z',
    totalSaves: 12,
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    errorMessage: 'Failed to save game state',
    totalSaves: 8,
    retryable: true,
    onRetryError: action('retry-error'),
  },
};

export const WithManualSave: Story = {
  args: {
    status: 'saved',
    lastSaveTime: new Date().toISOString(),
    totalSaves: 3,
    onManualSave: action('manual-save-triggered'),
  },
};

export const ManualSaveWhileSaving: Story = {
  args: {
    status: 'saving',
    totalSaves: 2,
    onManualSave: action('manual-save-triggered'),
  },
};

export const LongErrorMessage: Story = {
  args: {
    status: 'error',
    errorMessage: 'Network error: Unable to connect to the server. Please check your internet connection and try again.',
    totalSaves: 15,
    onManualSave: action('manual-save-triggered'),
    retryable: true,
    onRetryError: action('retry-error'),
  },
};

export const CompactMode: Story = {
  args: {
    status: 'saved',
    lastSaveTime: new Date().toISOString(),
    totalSaves: 7,
    compact: true,
    onManualSave: action('manual-save-triggered'),
  },
};

export const NonRetryableError: Story = {
  args: {
    status: 'error',
    errorMessage: 'Authentication failed. Please check your credentials.',
    totalSaves: 3,
    retryable: false,
    onManualSave: action('manual-save-triggered'),
  },
};