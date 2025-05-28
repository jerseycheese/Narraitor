import type { Meta, StoryObj } from '@storybook/react';
import { ErrorDisplay, InlineError, SectionError, PageError, ToastError } from './ErrorDisplay';
import { fn } from '@storybook/test';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'Narraitor/UI/Feedback/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A unified error display system supporting multiple variants and severity levels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'section', 'page', 'toast'],
      description: 'The display variant of the error',
    },
    severity: {
      control: 'select',
      options: ['error', 'warning', 'info'],
      description: 'Severity level affecting colors and styling',
    },
    title: {
      control: 'text',
      description: 'Optional title for section/page variants',
    },
    message: {
      control: 'text',
      description: 'The error message to display',
    },
    showRetry: {
      control: 'boolean',
      description: 'Show retry button',
    },
    showDismiss: {
      control: 'boolean',
      description: 'Show dismiss button',
    },
  },
  args: {
    onRetry: fn(),
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

// Showcase all variants and severities
export const AllVariants: Story = {
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Inline Errors</h3>
        <div className="space-y-2">
          <InlineError message="This field is required" severity="error" />
          <InlineError message="This name is already taken" severity="warning" />
          <InlineError message="This field will be auto-filled" severity="info" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Section Errors</h3>
        <div className="space-y-4 max-w-md">
          <SectionError
            title="Error Loading Data"
            message="Failed to load world data. Please check your connection and try again."
            severity="error"
            showRetry
            showDismiss
            onRetry={args.onRetry}
            onDismiss={args.onDismiss}
          />
          <SectionError
            title="Limited Features"
            message="Some features are unavailable in offline mode."
            severity="warning"
            showDismiss
            onDismiss={args.onDismiss}
          />
          <SectionError
            title="Tip"
            message="You can use AI suggestions to help create your world."
            severity="info"
            showDismiss
            onDismiss={args.onDismiss}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Page & Toast Examples</h3>
        <div className="space-y-4">
          <div className="border rounded-lg">
            <PageError
              title="World Not Found"
              message="The world you're looking for doesn't exist or has been deleted."
              severity="error"
              showRetry
              onRetry={args.onRetry}
            />
          </div>
          <div className="relative h-32 border rounded-lg">
            <ToastError
              title="Save Failed"
              message="Unable to save your changes."
              severity="error"
              showDismiss
              onDismiss={args.onDismiss}
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// Form validation example
export const FormValidation: Story = {
  render: () => (
    <div className="w-96 p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create World</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            World Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-invalid="true"
            aria-describedby="name-error"
          />
          <InlineError message="World name must be at least 3 characters" fieldName="name" />
        </div>
        <div>
          <label htmlFor="theme" className="block text-sm font-medium mb-1">
            Theme
          </label>
          <select
            id="theme"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Fantasy</option>
            <option>Sci-Fi</option>
            <option>Horror</option>
          </select>
        </div>
        <SectionError
          message="Please fix the errors above before continuing."
          severity="error"
        />
      </form>
    </div>
  ),
};

// Fallback content scenarios
export const FallbackScenarios: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Fallback Content Messages</h3>
      <div className="space-y-3 max-w-md">
        <ErrorDisplay
          variant="inline"
          severity="info"
          message="AI service temporarily unavailable - using curated content"
        />
        <ErrorDisplay
          variant="inline"
          severity="info"
          message="AI response timed out - using curated content"
        />
        <ErrorDisplay
          variant="inline"
          severity="info"
          message="Rate limit reached - using curated content"
        />
        <ErrorDisplay
          variant="inline"
          severity="info"
          message="An error occurred - using curated content"
        />
      </div>
    </div>
  ),
};

// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'section',
    severity: 'error',
    title: 'Operation Failed',
    message: 'Something went wrong while processing your request.',
    showRetry: true,
    showDismiss: true,
  },
};