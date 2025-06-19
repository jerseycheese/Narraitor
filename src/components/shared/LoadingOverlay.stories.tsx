import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { LoadingOverlay } from './LoadingOverlay';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'Narraitor/Shared/LoadingOverlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-screen modal overlay for navigation loading states. Uses the existing LoadingState component with modal behavior, cancel functionality, and keyboard support.',
      },
    },
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the overlay is visible',
    },
    variant: {
      control: 'select',
      options: ['spinner', 'pulse', 'dots', 'skeleton'],
      description: 'Loading indicator variant (from LoadingState component)',
    },
    message: {
      control: 'text',
      description: 'Loading message to display',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Optional cancel callback - shows cancel button if provided',
    },
  },
  args: {
    isVisible: true,
    variant: 'dots',
    message: 'Loading...',
  },
};

export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

// Default overlay behavior - primary use case
export const Default: Story = {
  args: {
    isVisible: true,
    variant: 'dots',
    message: 'Navigating to worlds...',
  },
};

// Cancellable operation (long-running tasks)
export const WithCancel: Story = {
  args: {
    isVisible: true,
    variant: 'spinner',
    message: 'Loading your world... This might take a moment.',
    onCancel: action('cancel-clicked'),
  },
};

// Error state with retry option
export const ErrorState: Story = {
  args: {
    isVisible: true,
    variant: 'spinner',
    message: 'Connection lost. Retrying...',
    onCancel: action('cancel-retry'),
  },
};

// Interactive demo showing overlay blocking behavior
export const InteractiveDemo: Story = {
  args: {
    isVisible: true,
    variant: 'skeleton',
    message: 'Loading content... Try to interact with background',
    onCancel: action('cancelled'),
  },
  render: (args) => {
    return (
      <div>
        <div className="p-8 bg-gray-100 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Background Content</h1>
          <p className="mb-4">This content should be blocked when the overlay is visible.</p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded mr-4">
            Background Button
          </button>
          <input 
            type="text" 
            placeholder="Try typing here..." 
            className="px-3 py-2 border rounded"
          />
          <p className="mt-4 text-sm text-gray-600">
            Toggle overlay visibility with controls. Test keyboard navigation (Tab, Escape).
          </p>
        </div>
        <LoadingOverlay {...args} />
      </div>
    );
  },
};

// Keyboard interaction testing
export const KeyboardSupport: Story = {
  args: {
    isVisible: true,
    variant: 'spinner',
    message: 'Press Escape to cancel, or use the button',
    onCancel: action('escape-pressed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test keyboard support: Escape key should trigger onCancel callback.',
      },
    },
  },
};