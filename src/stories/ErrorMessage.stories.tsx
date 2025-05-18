import type { Meta, StoryObj } from '@storybook/react';
import ErrorMessage from '../lib/components/ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Narraitor/Components/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'centered',
  },
  args: {
    onRetry: () => console.log('Retry clicked'),
    onDismiss: () => console.log('Dismiss clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NetworkError: Story = {
  args: {
    error: new Error('Network error'),
  },
};

export const TimeoutError: Story = {
  args: {
    error: new Error('Request timeout'),
  },
};

export const RateLimitError: Story = {
  args: {
    error: new Error('429 rate limit exceeded'),
  },
};

export const AuthenticationError: Story = {
  args: {
    error: new Error('401 unauthorized'),
  },
};

export const GenericError: Story = {
  args: {
    error: new Error('Unknown error occurred'),
  },
};

export const NoError: Story = {
  args: {
    error: null,
  },
};
