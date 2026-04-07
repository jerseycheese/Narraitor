import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import GameSessionError from '@/components/GameSession/GameSessionError';

const meta = {
  title: '03-Organisms/Game Session/GameSessionError',
  component: GameSessionError,
  parameters: {
    layout: 'padded',
  },
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof GameSessionError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: 'Failed to load game session data. Please try again.',
  },
};

export const WithDismiss: Story = {
  args: {
    error: 'Failed to load game session data. Please try again.',
    onDismiss: fn(),
  },
};

export const LongError: Story = {
  args: {
    error: 'An unexpected error occurred while attempting to load the game session. The server returned a 503 Service Unavailable response. This may be due to a temporary outage or high server load. Please wait a moment and try again. If the problem persists, check your connection or contact support.',
  },
};
