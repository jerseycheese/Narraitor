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
    initialCollapsed: {
      control: 'boolean',
      description: 'Whether the section is initially collapsed'
    },
    children: {
      control: false
    }
  },
  decorators: [
    (Story) => (
      <div className="dark">
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
      <div>
        <p>Section content goes here.</p>
        <p>This can be any React component.</p>
      </div>
    )
  }
};

export const InitiallyCollapsed: Story = {
  args: {
    title: 'Collapsed Section',
    initialCollapsed: true,
    children: (
      <div>
        <p>This content is initially hidden.</p>
      </div>
    )
  }
};

export const WithNestedContent: Story = {
  args: {
    title: 'Complex Content',
    children: (
      <div>
        <h3>Nested Heading</h3>
        <div>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </div>
      </div>
    )
  }
};

export const WithDevToolsContent: Story = {
  args: {
    title: 'State Information',
    children: (
      <div>
        <div>
          <span>currentWorldId:</span> <span>&quot;world-123&quot;</span>
        </div>
        <div>
          <span>loading:</span> <span>false</span>
        </div>
        <div>
          <span>error:</span> <span>null</span>
        </div>
      </div>
    )
  }
};

