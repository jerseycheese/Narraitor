import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '@/components/ui/toast/toast';
import { ToastProvider, useToast } from '@/components/ui/toast';

const meta = {
  title: 'Narraitor/UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    duration: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic toast stories
export const Success: Story = {
  args: {
    title: 'Success',
    description: 'Your changes have been saved successfully',
    variant: 'success',
  },
};

export const Error: Story = {
  args: {
    title: 'Error',
    description: 'There was a problem saving your changes',
    variant: 'error',
  },
};

export const Warning: Story = {
  args: {
    title: 'Warning',
    description: 'Please review your changes before continuing',
    variant: 'warning',
  },
};

export const Info: Story = {
  args: {
    title: 'Info',
    description: 'Your progress is being saved automatically',
    variant: 'info',
  },
};

export const WithoutDescription: Story = {
  args: {
    title: 'Simple notification',
    variant: 'success',
  },
};

export const PersistentToast: Story = {
  args: {
    title: 'Persistent notification',
    description: 'This toast will not auto-dismiss',
    variant: 'warning',
    duration: Infinity,
  },
};

export const LongContent: Story = {
  args: {
    title: 'Very long notification title that demonstrates wrapping',
    description: 'This is a very long description that demonstrates how the toast component handles lengthy content. It should wrap appropriately and maintain good readability.',
    variant: 'info',
  },
};

// Interactive demo with useToast hook
function InteractiveDemo() {
  const toast = useToast();

  const showSuccess = () => {
    toast.success('Game saved', 'Your progress has been saved successfully');
  };

  const showError = () => {
    toast.error('Save failed', 'Unable to save your progress. Please try again.');
  };

  const showWarning = () => {
    toast.warning('Auto-save paused', 'Auto-save has been temporarily paused due to network issues');
  };

  const showInfo = () => {
    toast.info('Feature available', 'New features are now available in the settings menu');
  };

  const showMultiple = () => {
    toast.success('First toast', 'This is the first toast');
    setTimeout(() => toast.warning('Second toast', 'This is the second toast'), 500);
    setTimeout(() => toast.info('Third toast', 'This is the third toast'), 1000);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold">Interactive Toast Demo</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={showSuccess}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Show Success
        </button>
        <button
          onClick={showError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Show Error
        </button>
        <button
          onClick={showWarning}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Show Warning
        </button>
        <button
          onClick={showInfo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Show Info
        </button>
        <button
          onClick={showMultiple}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Show Multiple
        </button>
      </div>
    </div>
  );
}

export const InteractiveToasts = {
  render: () => (
    <ToastProvider>
      <InteractiveDemo />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing all toast variants and the useToast hook in action',
      },
    },
  },
};

// Mobile responsive demo
export const MobileResponsive: Story = {
  args: {
    title: 'Mobile notification',
    description: 'This demonstrates how toasts appear on mobile devices',
    variant: 'info',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
  args: {
    title: 'Accessible notification',
    description: 'This toast includes proper ARIA attributes for screen readers',
    variant: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'This toast includes proper accessibility attributes: role="alert", aria-live="polite", and aria-atomic="true"',
      },
    },
  },
};