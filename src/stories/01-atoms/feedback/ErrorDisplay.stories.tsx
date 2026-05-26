import type { Meta, StoryObj } from '@storybook/react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { fn } from '@storybook/test';

const meta: Meta<typeof ErrorDisplay> = {
  title: '01-Atoms/feedback/ErrorDisplay',
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
      options: ['', 'section', 'page', 'toast'],
      description: 'The display variant of the error',
    },
    severity: {
      control: 'select',
      options: ['critical', 'error', 'warning', 'info'],
      description: 'Severity level affecting colors and prominence',
    },
    title: {
      control: 'text',
      description: 'Optional title for section/page variants',
    },
    message: {
      control: 'text',
      description: 'The error message to display',
    },
    suggestion: {
      control: 'text',
      description: 'Plain-language suggested next step shown below the message',
    },
    showRetry: {
      control: 'boolean',
      description: 'Show retry button (only for recoverable errors)',
    },
    maxRetries: {
      control: 'number',
      description: 'Attempts allowed before the retry button degrades to a fallback action',
    },
    fallbackMessage: {
      control: 'text',
      description: 'Message shown once retries are exhausted',
    },
    fallbackLabel: {
      control: 'text',
      description: 'Label for the fallback action shown once retries are exhausted',
    },
    showDismiss: {
      control: 'boolean',
      description: 'Show dismiss button',
    },
  },
  args: {
    onRetry: fn(),
    onDismiss: fn(),
    onFallback: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

// Showcase all variants and severities
export const AllVariants: Story = {
  render: (args) => (
    <div>
      <div>
        <h3>Inline Errors</h3>
        <div>
          <ErrorDisplay variant="inline" message="This field is required" severity="error" />
          <ErrorDisplay variant="inline" message="This name is already taken" severity="warning" />
          <ErrorDisplay variant="inline" message="This field will be auto-filled" severity="info" />
        </div>
      </div>

      <div>
        <h3>Section Errors</h3>
        <div>
          <ErrorDisplay
            variant="section"
            title="Error Loading Data"
            message="Failed to load world data. Please check your connection and try again."
            severity="error"
            showRetry
            showDismiss
            onRetry={args.onRetry}
            onDismiss={args.onDismiss}
          />
          <ErrorDisplay
            variant="section"
            title="Limited Features"
            message="Some features are unavailable in offline mode."
            severity="warning"
            showDismiss
            onDismiss={args.onDismiss}
          />
          <ErrorDisplay
            variant="section"
            title="Tip"
            message="You can use AI suggestions to help create your world."
            severity="info"
            showDismiss
            onDismiss={args.onDismiss}
          />
        </div>
      </div>

      <div>
        <h3>Page & Toast Examples</h3>
        <div>
          <div>
            <ErrorDisplay
              variant="page"
              title="World Not Found"
              message="The world you're looking for doesn't exist or has been deleted."
              severity="error"
              showRetry
              onRetry={args.onRetry}
            />
          </div>
          <div>
            <ErrorDisplay
              variant="toast"
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

// Severity ordering: critical is the most prominent, info the least intrusive.
// Each shows a plain-language suggested next step under the message.
export const SeverityLevels: Story = {
  render: (args) => (
    <div>
      <ErrorDisplay
        variant="section"
        severity="critical"
        title="Authentication Error"
        message="We couldn't verify your AI service credentials."
        suggestion="Check that your API key is set correctly in Settings."
        showDismiss
        onDismiss={args.onDismiss}
      />
      <ErrorDisplay
        variant="section"
        severity="error"
        title="Connection Problem"
        message="Unable to connect. Please check your internet connection."
        suggestion="Make sure you are online, then try again."
        showRetry
        onRetry={args.onRetry}
      />
      <ErrorDisplay
        variant="section"
        severity="warning"
        title="Request Timed Out"
        message="The request is taking too long."
        suggestion="This is usually temporary — wait a moment and try again."
        showRetry
        onRetry={args.onRetry}
      />
      <ErrorDisplay
        variant="section"
        severity="info"
        title="Heads Up"
        message="Some features are unavailable in offline mode."
        suggestion="Reconnect to use AI-assisted tools."
        showDismiss
        onDismiss={args.onDismiss}
      />
    </div>
  ),
};

// Form validation example
export const FormValidation: Story = {
  render: () => (
    <div>
      <h2>Create World</h2>
      <form>
        <div>
          <label htmlFor="name" >
            World Name
          </label>
          <input
            id="name"
            type="text"
            
            aria-invalid="true"
            aria-describedby="name-error"
          />
          <ErrorDisplay variant="inline" message="World name must be at least 3 characters" fieldName="name" />
        </div>
        <div>
          <label htmlFor="theme" >
            Theme
          </label>
          <select
            id="theme"
            
          >
            <option>Fantasy</option>
            <option>Sci-Fi</option>
            <option>Horror</option>
          </select>
        </div>
        <ErrorDisplay
          variant="section"
          message="Please fix the errors above before continuing."
          severity="error"
        />
      </form>
    </div>
  ),
};


// Recoverable error: retry shows in-progress feedback, then degrades to a
// fallback action after the configured number of attempts. Click "Try Again"
// twice (each attempt simulates a ~1.2s failed call) to see the fallback appear.
export const RetryWithFallback: Story = {
  render: () => {
    const failingRetry = () =>
      new Promise<void>((resolve) => setTimeout(resolve, 1200));

    return (
      <ErrorDisplay
        variant="section"
        severity="error"
        title="Couldn't Generate the Next Scene"
        message="The AI service didn't respond in time."
        suggestion="This is usually temporary — try again."
        showRetry
        onRetry={failingRetry}
        maxRetries={2}
        fallbackMessage="Still stuck after a couple of tries. You can head back to your worlds and pick up later."
        fallbackLabel="Back to Worlds"
        onFallback={fn()}
      />
    );
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'section',
    severity: 'error',
    title: 'Operation Failed',
    message: 'Something went wrong while processing your request.',
    suggestion: 'Try again. If the problem continues, reload the page.',
    showRetry: true,
    showDismiss: true,
  },
};
