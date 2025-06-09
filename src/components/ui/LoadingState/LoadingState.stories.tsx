import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from './LoadingState';

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

// Loader type demonstrations
export const LoaderTypes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="text-center p-6 border rounded-lg">
          <h4 className="font-medium mb-4">Spinner</h4>
          <LoadingState variant="spinner" theme="light" message="Loading..." />
          <p className="text-sm text-gray-600 mt-2">General purpose loading</p>
        </div>
        <div className="text-center p-6 border rounded-lg">
          <h4 className="font-medium mb-4">Dots</h4>
          <LoadingState variant="dots" theme="light" message="Processing..." />
          <p className="text-sm text-gray-600 mt-2">Quick processing tasks</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h4 className="font-medium mb-4 text-center">Skeleton</h4>
          <LoadingState variant="skeleton" theme="light" skeletonLines={3} />
          <p className="text-sm text-gray-600 mt-2 text-center">Content placeholder</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h4 className="font-medium mb-4 text-center">Pulse</h4>
          <LoadingState variant="pulse" theme="light" showAvatar skeletonLines={2} />
          <p className="text-sm text-gray-600 mt-2 text-center">Profile/card loading</p>
        </div>
      </div>
    </div>
  ),
};

// Theme demonstrations - Core functionality
export const LightTheme: Story = {
  args: {
    variant: 'spinner',
    size: 'md',
    theme: 'light',
    message: 'Loading on light background...',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white border rounded-lg min-h-[200px]">
        <Story />
      </div>
    ),
  ],
};

export const DarkTheme: Story = {
  args: {
    variant: 'spinner',
    size: 'md',
    theme: 'dark',
    message: 'Loading on dark background...',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-800 border border-gray-600 rounded-lg min-h-[200px]">
        <Story />
      </div>
    ),
  ],
};


// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'spinner',
    size: 'md',
    theme: 'light',
    message: 'Loading...',
    centered: true,
    inline: false,
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Theme for text and elements (light or dark background)',
    },
  },
};
