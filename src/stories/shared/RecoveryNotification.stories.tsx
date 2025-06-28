import type { Meta, StoryObj } from '@storybook/react';
import { RecoveryNotification } from '../../components/shared/RecoveryNotification';

const meta = {
  title: 'Narraitor/Shared/RecoveryNotification',
  component: RecoveryNotification,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Recovery notification dialog that appears when data recovery is available.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the notification is visible',
    },
    lastSaved: {
      control: 'text',
      description: 'Last saved timestamp',
    },
    onRecover: {
      action: 'recover',
      description: 'Called when user clicks recover',
    },
    onDismiss: {
      action: 'dismiss',
      description: 'Called when user dismisses the notification',
    },
  },
} satisfies Meta<typeof RecoveryNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {
  args: {
    isVisible: true,
    lastSaved: new Date().toISOString(),
    onRecover: () => console.log('Recover clicked'),
    onDismiss: () => console.log('Dismiss clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery notification in visible state with recent save timestamp.',
      },
    },
  },
};

export const VisibleWithOldSave: Story = {
  args: {
    isVisible: true,
    lastSaved: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
    onRecover: () => console.log('Recover clicked'),
    onDismiss: () => console.log('Dismiss clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery notification with an older save timestamp.',
      },
    },
  },
};

export const VisibleWithoutTimestamp: Story = {
  args: {
    isVisible: true,
    lastSaved: undefined,
    onRecover: () => console.log('Recover clicked'),
    onDismiss: () => console.log('Dismiss clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery notification without timestamp information.',
      },
    },
  },
};

