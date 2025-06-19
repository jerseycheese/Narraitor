import type { Meta, StoryObj } from '@storybook/react';
import { JournalFloatingButton } from './JournalFloatingButton';

const meta: Meta<typeof JournalFloatingButton> = {
  title: 'Narraitor/GameSession/Journal/JournalFloatingButton',
  component: JournalFloatingButton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Floating action button for quick journal access during gameplay. Features visual indicators for unread entries and includes keyboard shortcut hint.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Callback when button is clicked'
    },
    hasUnreadEntries: {
      control: 'boolean',
      description: 'Whether there are unread journal entries (shows red indicator dot)'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    hasUnreadEntries: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default floating action button for journal access. Positioned fixed at bottom-right with book icon.',
      },
    },
  },
};

export const WithUnreadEntries: Story = {
  args: {
    hasUnreadEntries: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with unread indicator showing red dot and pulsing animation to draw attention to new journal entries.',
      },
    },
  },
};

export const CustomPosition: Story = {
  args: {
    hasUnreadEntries: false,
    className: 'bottom-4 right-4', // Override default positioning
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom positioning using className prop.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    hasUnreadEntries: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version showing hover effects and click behavior. Try clicking to see the action in the Actions panel.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    // This would be used for interaction testing in Storybook
    const button = canvasElement.querySelector('button');
    if (button) {
      // Simulate hover for demonstration
      button.style.transform = 'scale(1.05)';
    }
  },
};