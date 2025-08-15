import type { Meta, StoryObj } from '@storybook/react';
import { ErrorSection } from './ErrorSection';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

const meta: Meta<typeof ErrorSection> = {
  title: 'DevTools/ErrorSection',
  component: ErrorSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'DevTools section for displaying and managing runtime errors captured during application execution.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ErrorSection>;

// Helper function to clear and populate errors for demos
const setupDemoErrors = (errors: Array<{
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  componentContext?: { componentName: string; componentStack: string };
}>) => {
  runtimeErrorLogger.clearErrors();
  errors.forEach(error => {
    runtimeErrorLogger.logError(
      error.message,
      error.severity,
      error.category,
      error.componentContext ? { componentContext: error.componentContext } : undefined
    );
  });
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => {
    // Clear all errors for this story
    runtimeErrorLogger.clearErrors();
    return <ErrorSection />;
  }
};

export const WithErrors: Story = {
  name: 'With Various Errors',
  render: () => {
    setupDemoErrors([
      {
        message: 'Failed to fetch user data from API',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK
      },
      {
        message: 'Component state update on unmounted component',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.REACT,
        componentContext: {
          componentName: 'UserProfile',
          componentStack: 'at UserProfile\n  at Dashboard\n  at App'
        }
      },
      {
        message: 'AI service request timeout',
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.AI_SERVICE
      },
      {
        message: 'Invalid email format in form validation',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION
      }
    ]);
    
    return <ErrorSection />;
  }
};

export const HighSeverityOnly: Story = {
  name: 'High Severity Errors Only',
  render: () => {
    setupDemoErrors([
      {
        message: 'Database connection failed',
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.NETWORK
      },
      {
        message: 'Memory leak detected in component',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.REACT,
        componentContext: {
          componentName: 'DataVisualization',
          componentStack: 'at DataVisualization\n  at ReportPage\n  at App'
        }
      }
    ]);
    
    return <ErrorSection />;
  }
};

export const WithDismissedErrors: Story = {
  name: 'With Dismissed Errors',
  render: () => {
    setupDemoErrors([
      {
        message: 'Network request failed',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK
      },
      {
        message: 'Form validation error',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION
      }
    ]);
    
    // Dismiss the first error to show mixed state
    const errors = runtimeErrorLogger.getErrors();
    if (errors.length > 0) {
      runtimeErrorLogger.dismissError(errors[0].id);
    }
    
    return <ErrorSection />;
  }
};

export const Interactive: Story = {
  name: 'Interactive Demo',
  render: () => {
    // Setup some initial errors
    setupDemoErrors([
      {
        message: 'Example React component error',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.REACT,
        componentContext: {
          componentName: 'ExampleComponent',
          componentStack: 'at ExampleComponent\n  at ExamplePage\n  at App'
        }
      },
      {
        message: 'Network timeout after 30 seconds',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK
      }
    ]);
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Interactive Demo</h3>
          <p className="text-sm text-blue-700 mb-3">
            This demo shows the ErrorSection with sample errors. You can:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
            <li>Expand error details to see stack traces and component context</li>
            <li>Dismiss individual errors using the × button</li>
            <li>Filter errors by severity or category using the filters</li>
            <li>Clear all errors with the &quot;Clear All&quot; button</li>
            <li>Toggle showing dismissed errors</li>
          </ul>
        </div>
        <ErrorSection />
      </div>
    );
  }
};