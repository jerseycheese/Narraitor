import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: '02-Molecules/ui-components/layout/CollapsibleSection',
  component: CollapsibleSection,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A collapsible section component for the DevTools panel. Always displays in dark theme as it\'s part of the DevTools UI.'
      }
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' }, // gray-900 from our design system
      ]
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Section title'
    },
    initiallyExpanded: {
      control: 'boolean',
      description: 'Whether the section is initially expanded'
    },
    children: {
      control: false
    }
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-900 rounded-lg dark min-w-[400px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  args: {
    title: 'Example Section',
    children: (
      <div className="p-4 bg-gray-700 rounded">
        <p className="text-gray-200">Section content goes here.</p>
        <p className="text-gray-200">This can be any React component.</p>
      </div>
    )
  }
};

export const InitiallyCollapsed: Story = {
  args: {
    title: 'Collapsed Section',
    initiallyExpanded: false,
    children: (
      <div className="p-4 bg-gray-700 rounded">
        <p className="text-gray-200">This content is initially hidden.</p>
      </div>
    )
  }
};

export const WithNestedContent: Story = {
  args: {
    title: 'Complex Content',
    children: (
      <div className="p-4 bg-gray-700 rounded">
        <h3 className="text-lg font-bold mb-2 text-gray-200">Nested Heading</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 bg-gray-700 rounded shadow text-gray-200">Item 1</div>
          <div className="p-2 bg-gray-700 rounded shadow text-gray-200">Item 2</div>
          <div className="p-2 bg-gray-700 rounded shadow text-gray-200">Item 3</div>
          <div className="p-2 bg-gray-700 rounded shadow text-gray-200">Item 4</div>
        </div>
      </div>
    )
  }
};

export const WithDevToolsContent: Story = {
  args: {
    title: 'State Information',
    children: (
      <div className="font-mono text-sm">
        <div className="p-2 bg-gray-700 rounded mb-2">
          <span className="text-gray-500">currentWorldId:</span> <span className="text-green-500">&quot;world-123&quot;</span>
        </div>
        <div className="p-2 bg-gray-700 rounded mb-2">
          <span className="text-gray-500">loading:</span> <span className="text-blue-500">false</span>
        </div>
        <div className="p-2 bg-gray-700 rounded">
          <span className="text-gray-500">error:</span> <span className="text-red-500">null</span>
        </div>
      </div>
    )
  }
};

