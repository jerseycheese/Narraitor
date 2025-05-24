import type { Meta, StoryObj } from '@storybook/react';
import GameSessionError from './GameSessionError';

const meta: Meta<typeof GameSessionError> = {
  title: 'Narraitor/Game/Session/GameSessionError',
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
    error: 'Failed to load game session',
  },
};

export const WithDismiss: Story = {
  args: {
    error: 'World not found',
    onDismiss: () => {},
  },
};

export const NetworkError: Story = {
  args: {
    error: 'Network connection lost. Please check your internet connection.',
  },
};

export const AIError: Story = {
  args: {
    error: 'Failed to generate narrative. The AI service is temporarily unavailable.',
  },
};

export const GenericError: Story = {
  args: {
    error: 'An unexpected error occurred. Please try again.',
  },
};