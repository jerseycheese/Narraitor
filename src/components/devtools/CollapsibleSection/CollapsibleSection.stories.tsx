import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from './CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Narraitor/DevTools/CollapsibleSection',
  component: CollapsibleSection,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A collapsible section component for the DevTools panel'
      }
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
  }
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  args: {
    title: 'Example Section',
    children: (
      <div className="p-4 bg-gray-100 rounded">
        <p>Section content goes here.</p>
        <p>This can be any React component.</p>
      </div>
    )
  }
};

export const InitiallyCollapsed: Story = {
  args: {
    title: 'Collapsed Section',
    initiallyExpanded: false,
    children: (
      <div className="p-4 bg-gray-100 rounded">
        <p>This content is initially hidden.</p>
      </div>
    )
  }
};

export const WithNestedContent: Story = {
  args: {
    title: 'Complex Content',
    children: (
      <div className="p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-bold mb-2">Nested Heading</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 bg-white rounded shadow">Item 1</div>
          <div className="p-2 bg-white rounded shadow">Item 2</div>
          <div className="p-2 bg-white rounded shadow">Item 3</div>
          <div className="p-2 bg-white rounded shadow">Item 4</div>
        </div>
      </div>
    )
  }
};