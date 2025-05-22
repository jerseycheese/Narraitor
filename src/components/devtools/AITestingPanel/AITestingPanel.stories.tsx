import type { Meta, StoryObj } from '@storybook/react';
import { AITestingPanel } from './AITestingPanel';

const meta: Meta<typeof AITestingPanel> = {
  title: 'Narraitor/DevTools/AITestingPanel',
  component: AITestingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'AI Testing Panel for debugging narrative generation with custom inputs. Allows developers to override world, character, and narrative context to test AI responses.'
      }
    }
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AITestingPanel>;

export const Default: Story = {
  args: {
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: 'Default AI Testing Panel with standard styling for testing narrative generation with custom inputs.'
      }
    }
  }
};

export const InDevToolsContext: Story = {
  args: {
    className: 'text-xs'
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-50 p-4 border border-gray-200 text-xs">
        <h3 className="text-sm font-medium mb-2">DevTools Panel Context</h3>
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story: 'AI Testing Panel as it appears within the DevTools panel with smaller text and gray background.'
      }
    }
  }
};