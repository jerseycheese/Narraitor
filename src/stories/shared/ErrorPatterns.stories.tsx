import type { Meta, StoryObj } from '@storybook/react';
import { errorStyles } from '@/styles/errorStyles';

// Generic ErrorBlock component for reuse
interface ErrorBlockProps {
  errors: string[];
  className?: string;
}

const ErrorBlock: React.FC<ErrorBlockProps> = ({ errors, className }) => (
  <div className={className || errorStyles.container}>
    {errors.map((error: string, index: number) => (
      <p key={index} className={errorStyles.message}>
        {error}
      </p>
    ))}
  </div>
);

// Generic InlineError component for reuse
interface InlineErrorProps {
  error: string;
  className?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ error, className }) => (
  <p className={className || errorStyles.message}>
    {error}
  </p>
);

const meta: Meta = {
  title: 'Narraitor/Shared/Error Patterns',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Standardized error display patterns for consistent user feedback across all forms and wizards.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BlockLevelErrors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Single Error</h3>
        <ErrorBlock errors={['This field is required']} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Multiple Errors</h3>
        <ErrorBlock errors={[
          'Name must be at least 3 characters',
          'Name must be unique within this world',
          'Special characters are not allowed'
        ]} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Validation Summary</h3>
        <ErrorBlock errors={[
          'Character history must be at least 50 characters',
          'Personality description is required',
          'Please select at least one skill'
        ]} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Block-level errors displayed in a red container. Use for form validation summaries or when multiple related errors need to be shown together.',
      },
    },
  },
};

export const InlineErrors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Field-Level Errors</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
              value="AB"
              readOnly
            />
            <InlineError error="Name must be at least 3 characters" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
              value="invalid-email"
              readOnly
            />
            <InlineError error="Please enter a valid email address" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inline errors displayed directly under individual form fields. Use for immediate field validation feedback.',
      },
    },
  },
};

export const ErrorStyles: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Error Container Classes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">errorStyles.container</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              p-4 bg-red-50 border border-red-200 rounded-lg
            </code>
            <div className="mt-2">
              <div className={errorStyles.container}>
                <p className={errorStyles.message}>Example error message in container</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">errorStyles.message</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              text-red-600 text-sm mt-1
            </code>
            <div className="mt-2">
              <p className={errorStyles.message}>Example inline error message</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available CSS classes for error styling. Import errorStyles from @/styles/errorStyles to use these standardized styles.',
      },
    },
  },
};

export const UsageExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Character Creation Pattern</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto">
{`// Import styles
import { errorStyles } from '@/styles/errorStyles';
// Or use the reusable component
import { ErrorBlock } from '@/components/shared';

// Option 1: Using errorStyles directly
const showErrors = validation?.touched && !validation?.valid;

{showErrors && (
  <div className={errorStyles.container}>
    {validation.errors.map((error: string, index: number) => (
      <p key={index} className={errorStyles.message}>
        {error}
      </p>
    ))}
  </div>
)}

// Option 2: Using ErrorBlock component
{showErrors && <ErrorBlock errors={validation.errors} />}`}
          </pre>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">World Creation Pattern</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto">
{`// In wizard component
const currentError = validation?.touched && !validation?.valid 
  ? validation.errors.join(', ') 
  : undefined;

// Render with WizardStep
<WizardStep error={currentError}>
  {/* step content */}
</WizardStep>`}
          </pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Code examples showing how to implement these error patterns in your components.',
      },
    },
  },
};