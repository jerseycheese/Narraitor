import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState, LoadingSpinner, LoadingSkeleton, LoadingDots, LoadingPulse } from './LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'Narraitor/UI/Feedback/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A unified loading state component system for consistent loading indicators across the application.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'pulse', 'dots', 'skeleton'],
      description: 'The type of loading indicator to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the loading indicator',
    },
    message: {
      control: 'text',
      description: 'Optional message to display with the loading indicator',
    },
    centered: {
      control: 'boolean',
      description: 'Whether to center the loading state in its container',
    },
    inline: {
      control: 'boolean',
      description: 'Whether to display the loading state inline',
    },
    skeletonLines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of skeleton lines (for skeleton variant)',
    },
    showAvatar: {
      control: 'boolean',
      description: 'Whether to show avatar placeholder (for pulse variant)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

// Basic variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Spinner</h3>
        <LoadingSpinner message="Loading..." />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Dots</h3>
        <LoadingDots message="Processing" />
      </div>
      <div className="w-96 mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Skeleton</h3>
        <LoadingSkeleton skeletonLines={3} />
      </div>
      <div className="w-96 mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Pulse</h3>
        <LoadingPulse showAvatar skeletonLines={3} />
      </div>
    </div>
  ),
};

// Common use cases in Narraitor
export const NarratorUseCases: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">World Loading</h3>
        <div className="w-96 border rounded-lg p-4">
          <LoadingPulse message="Loading your worlds..." skeletonLines={3} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Narrative Generation</h3>
        <LoadingSpinner size="lg" message="Generating narrative..." />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
        <LoadingDots message="Analyzing world description..." />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Button Loading States</h3>
        <div className="space-x-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50" disabled>
            <LoadingSpinner size="sm" inline message="Saving..." />
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2" disabled>
            <LoadingSpinner size="sm" inline centered={false} />
            <span>Creating World</span>
          </button>
        </div>
      </div>
    </div>
  ),
};

// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'spinner',
    size: 'md',
    message: 'Loading...',
    centered: true,
    inline: false,
  },
};
