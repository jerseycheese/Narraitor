import type { Meta, StoryObj } from '@storybook/react';
import { AITestingPanel } from '@/components/devtools/AITestingPanel/AITestingPanel';

const meta: Meta<typeof AITestingPanel> = {
  title: '03-Organisms/devtools/panels/AITestingPanel',
  component: AITestingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A DevTools panel for testing narrative generation with custom inputs, without creating full world/character data: override world, character, and narrative context, run mock generation, and log the request/response. Used within the DevTools panel during development.`
      }
    }
  },
  decorators: [
    (Story) => (
      <div>
        <div>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the AI Testing Panel with empty form fields
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'The default state shows empty form fields ready for developer input.'
      }
    }
  }
};


/**
 * Compact version for smaller DevTools panels
 */
export const Compact: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div>
        <div>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows how the panel adapts to smaller sizes.'
      }
    }
  }
};
