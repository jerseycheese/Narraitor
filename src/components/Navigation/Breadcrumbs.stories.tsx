import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Narraitor/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Enhanced breadcrumbs component with optional next-step guidance for navigation flow.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    showNextStep: {
      control: 'boolean',
      description: 'Show next step guidance in breadcrumbs',
    },
    maxItems: {
      control: 'number',
      description: 'Maximum number of breadcrumb items to show (for mobile)',
    },
    separator: {
      control: 'text',
      description: 'Custom separator between breadcrumb items',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StandardBreadcrumbs: Story = {
  name: 'Standard Breadcrumbs',
  args: {
    showNextStep: false,
  },
};

export const WithNextStepGuidance: Story = {
  name: 'With Next Step Guidance',
  args: {
    showNextStep: true,
  },
};

export const MobileView: Story = {
  name: 'Mobile View (Max 2 Items)',
  args: {
    showNextStep: true,
    maxItems: 2,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const CustomSeparator: Story = {
  name: 'Custom Separator',
  args: {
    showNextStep: true,
    separator: '/',
  },
};