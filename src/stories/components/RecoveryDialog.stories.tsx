import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';

const meta: Meta<typeof RecoveryNotification> = {
  title: 'Components/RecoveryNotification',
  component: RecoveryNotification,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RecoveryNotification>;

export const Default: Story = {
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T14:30:00.000Z',
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const WithoutTimestamp: Story = {
  args: {
    isVisible: true,
    lastSaved: undefined,
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const Hidden: Story = {
  args: {
    isVisible: false,
    lastSaved: '2023-12-15T14:30:00.000Z',
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};