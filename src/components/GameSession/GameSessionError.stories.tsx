import type { Meta, StoryObj } from '@storybook/react';
import GameSessionError from './GameSessionError';

const meta: Meta<typeof GameSessionError> = {
  title: 'Narraitor/Game/States/GameSessionError',
  component: GameSessionError,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onRetry: { action: 'retry clicked' },
    onDismiss: { action: 'dismiss clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: 'Failed to load game session. Please try again.',
  },
};

export const WithDismissOption: Story = {
  args: {
    error: 'World not found or has been deleted.',
    onDismiss: () => {},
  },
};
