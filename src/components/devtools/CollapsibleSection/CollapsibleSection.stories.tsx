import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from './CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Narraitor/DevTools/Components/CollapsibleSection',
  component: CollapsibleSection,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A collapsible section component for the DevTools panel. Designed for dark theme contexts.'
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

// Light theme wrapper for Storybook display
const LightThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-8 bg-white rounded-lg">
    {children}
  </div>
);

// Dark theme wrapper to show how component looks in actual DevTools context
const DarkThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-8 bg-slate-800 rounded-lg dark">
    {children}
  </div>
);

export const Default: Story = {
  args: {
    title: 'Example Section',
    children: (
      <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded">
        <p className="text-gray-800 dark:text-gray-200">Section content goes here.</p>
        <p className="text-gray-800 dark:text-gray-200">This can be any React component.</p>
      </div>
    )
  },
  render: (args) => (
    <LightThemeWrapper>
      <CollapsibleSection {...args} />
    </LightThemeWrapper>
  )
};

export const DarkTheme: Story = {
  args: {
    title: 'DevTools Context',
    children: (
      <div className="p-4 bg-slate-700 rounded">
        <p className="text-gray-200">This shows how the component looks in the actual DevTools panel.</p>
        <p className="text-gray-200">The DevTools panel uses a dark theme by default.</p>
      </div>
    )
  },
  render: (args) => (
    <DarkThemeWrapper>
      <CollapsibleSection {...args} />
    </DarkThemeWrapper>
  )
};

export const InitiallyCollapsed: Story = {
  args: {
    title: 'Collapsed Section',
    initiallyExpanded: false,
    children: (
      <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded">
        <p className="text-gray-800 dark:text-gray-200">This content is initially hidden.</p>
      </div>
    )
  },
  render: (args) => (
    <LightThemeWrapper>
      <CollapsibleSection {...args} />
    </LightThemeWrapper>
  )
};

export const WithNestedContent: Story = {
  args: {
    title: 'Complex Content',
    children: (
      <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded">
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Nested Heading</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 bg-white dark:bg-slate-600 rounded shadow text-gray-800 dark:text-gray-200">Item 1</div>
          <div className="p-2 bg-white dark:bg-slate-600 rounded shadow text-gray-800 dark:text-gray-200">Item 2</div>
          <div className="p-2 bg-white dark:bg-slate-600 rounded shadow text-gray-800 dark:text-gray-200">Item 3</div>
          <div className="p-2 bg-white dark:bg-slate-600 rounded shadow text-gray-800 dark:text-gray-200">Item 4</div>
        </div>
      </div>
    )
  },
  render: (args) => (
    <LightThemeWrapper>
      <CollapsibleSection {...args} />
    </LightThemeWrapper>
  )
};