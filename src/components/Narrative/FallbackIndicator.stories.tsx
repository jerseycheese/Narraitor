import type { Meta, StoryObj } from '@storybook/react';
import { FallbackIndicator } from './FallbackIndicator';

const meta: Meta<typeof FallbackIndicator> = {
  title: 'Narraitor/Narrative/FallbackIndicator',
  component: FallbackIndicator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays a notification when fallback content is being used instead of AI-generated content'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the indicator is visible'
    },
    reason: {
      control: 'select',
      options: ['service_unavailable', 'timeout', 'error', 'rate_limit'],
      description: 'The reason for using fallback content'
    }
  }
};

export default meta;
type Story = StoryObj<typeof FallbackIndicator>;

export const Default: Story = {
  args: {
    isVisible: true,
    reason: 'service_unavailable'
  }
};

export const Timeout: Story = {
  args: {
    isVisible: true,
    reason: 'timeout'
  }
};

export const Error: Story = {
  args: {
    isVisible: true,
    reason: 'error'
  }
};

export const RateLimit: Story = {
  args: {
    isVisible: true,
    reason: 'rate_limit'
  }
};

export const Hidden: Story = {
  args: {
    isVisible: false,
    reason: 'service_unavailable'
  }
};

export const WithCustomStyling: Story = {
  args: {
    isVisible: true,
    reason: 'service_unavailable',
    className: 'shadow-lg'
  }
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <FallbackIndicator isVisible={true} reason="service_unavailable" />
      <FallbackIndicator isVisible={true} reason="timeout" />
      <FallbackIndicator isVisible={true} reason="error" />
      <FallbackIndicator isVisible={true} reason="rate_limit" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All fallback indicator variants displayed together'
      }
    }
  }
};