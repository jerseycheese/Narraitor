/**
 * Toast Component Stories
 * 
 * Comprehensive Storybook documentation for the Toast notification system.
 * Includes examples of all variants, interactive demos, and accessibility features.
 * 
 * @storybook
 * @component Toast
 * @integration Shows integration with useToast hook and ToastProvider
 * @accessibility Demonstrates proper ARIA attributes and screen reader support
 * @mobile Shows responsive behavior on mobile devices
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '@/components/ui/toast/toast';
import { ToastProvider, useToast } from '@/components/ui/toast';

const meta = {
  title: '06-Patterns/ui-patterns/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Toast notifications for displaying temporary messages to users. ## Features - Four visual variants: success, error, warning, info - Auto-dismissal with configurable duration - Manual dismissal with close button - Full accessibility support with ARIA attributes - Mobile-responsive design - Integration with AutoSave service ## Usage Use the useToast hook to display notifications: \`\`\`tsx const toast = useToast() toast.success('Operation completed', 'Your changes have been saved') \`\`\``,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Visual variant that determines the toast appearance and semantic meaning',
    },
    duration: {
      control: 'number',
      description: 'Duration in milliseconds before auto-dismiss. Use Infinity to disable auto-dismiss',
    },
    title: {
      control: 'text',
      description: 'The main title text of the toast notification',
    },
    description: {
      control: 'text',
      description: 'Optional description text shown below the title',
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
  parameters: {
    docs: {
      description: {
        story: 'Every variant renders with role="alert", aria-live="polite", and aria-atomic="true".',
      },
    },
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

export const LongContent: Story = {
  args: {
    title: 'Very long notification title that demonstrates wrapping',
    description: 'This is a very long description that demonstrates how the toast component handles lengthy content. It should wrap appropriately and maintain good readability.',
    variant: 'info',
  },
};

/**
 * Interactive demo component showing the useToast hook in action
 * 
 * Demonstrates:
 * - All toast variants (success, error, warning, info)
 * - Multiple toast management
 * - Real-world usage patterns
 * - Integration with ToastProvider
 */
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
    <div>
      <h3>Interactive Toast Demo</h3>
      <div>
        <button
          onClick={showSuccess}
          
        >
          Show Success
        </button>
        <button
          onClick={showError}
          
        >
          Show Error
        </button>
        <button
          onClick={showWarning}
          
        >
          Show Warning
        </button>
        <button
          onClick={showInfo}
          
        >
          Show Info
        </button>
        <button
          onClick={showMultiple}
          
        >
          Show Multiple
        </button>
      </div>
    </div>
  );
}

/**
 * Interactive toast demonstration story
 * 
 * Shows how to use the toast system in a real application context.
 * Includes ToastProvider wrapper and demonstrates all toast variants.
 */
export const InteractiveToasts = {
  render: () => (
    <ToastProvider>
      <InteractiveDemo />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `Interactive demo showing all toast variants and the useToast hook in action. This story demonstrates: - Integration with ToastProvider - All four toast variants - Multiple toast management - Real-world usage patterns - Auto-dismissal behavior Click the buttons to see different toast types in action.`,
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