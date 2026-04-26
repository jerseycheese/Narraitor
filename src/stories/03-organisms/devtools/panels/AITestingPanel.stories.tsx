import type { Meta, StoryObj } from '@storybook/react';
import { AITestingPanel } from '@/components/devtools/AITestingPanel/AITestingPanel';

const meta: Meta<typeof AITestingPanel> = {
  title: '03-Organisms/devtools/panels/AITestingPanel',
  component: AITestingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `The AI Testing Panel is a development tool that allows developers to test narrative generation with custom inputs. It provides form controls to override world, character, and narrative context for testing purposes. **Key Features:** - World context override (name, theme) - Character context override (name) - Mock AI narrative generation - Request/response logging - Dark theme styling for DevTools integration **Usage:** This component is designed to be used within the DevTools panel during development. It allows developers to quickly test different scenarios without creating full world/character data.`
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
