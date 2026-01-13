import type { Meta, StoryObj } from '@storybook/react';
import { JournalFloatingButton } from '@/components/GameSession/JournalFloatingButton';

const meta: Meta<typeof JournalFloatingButton> = {
  title: '03-Organisms/journal/JournalFloatingButton',
  component: JournalFloatingButton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Floating action button for quick journal access during gameplay.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Callback when button is clicked'
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default floating action button for journal access. Positioned fixed at bottom-right with book icon.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Interactive version showing hover effects and click behavior. Try clicking to see the action in the Actions panel.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // This would be used for interaction testing in Storybook
    const button = canvasElement.querySelector('button');
    if (button) {
      // Simulate hover for demonstration
      button.style.transform = 'scale(1.05)';
    }
  },
};