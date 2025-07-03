import type { Meta, StoryObj } from '@storybook/react';
import { DevToolsSection } from './DevToolsSection';

const meta: Meta<typeof DevToolsSection> = {
  title: 'Narraitor/DevTools/DevToolsSection',
  component: DevToolsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A reusable container component for DevTools panels that provides consistent dark theme styling and layout. 
This component eliminates code duplication across DevTools sections by encapsulating the common UI pattern.

**Key Features:**
- Consistent dark theme styling (slate-700 background, slate-600 borders)
- Optional title with proper typography hierarchy
- Flexible content area that accepts any React nodes
- Extensible via className prop for additional styling
- Replaces repeated styling patterns across DevTools components
        `
      }
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Optional title to display at the top of the section'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the container'
    },
    children: {
      control: false,
      description: 'Content to render inside the section'
    }
  }
};

export default meta;
type Story = StoryObj<typeof DevToolsSection>;

export const Default: Story = {
  args: {
    children: <div className="text-slate-300 text-sm">Default section content goes here.</div>
  }
};

export const WithTitle: Story = {
  args: {
    title: 'Section Title',
    children: <div className="text-slate-300 text-sm">Content with a title displayed above.</div>
  }
};

export const LoreStatistics: Story = {
  name: 'Lore Statistics Example',
  args: {
    title: 'Lore Statistics',
    children: (
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
        <div>Total Facts: 15</div>
        <div>High Importance: 3</div>
        <div>Characters: 5</div>
        <div>Locations: 4</div>
        <div>World Rules: 3</div>
        <div>Historical Events: 3</div>
      </div>
    )
  }
};

export const WorldSelection: Story = {
  name: 'World Selection Example',
  args: {
    children: (
      <div>
        <label className="block text-xs text-slate-300 mb-1">
          Select World for Analysis:
        </label>
        <select className="w-full bg-slate-600 text-slate-200 border border-slate-500 rounded px-2 py-1 text-xs">
          <option value="">-- Select a World --</option>
          <option value="world-1">Fantasy Realm</option>
          <option value="world-2">Sci-Fi Universe</option>
          <option value="world-3">Modern Setting</option>
        </select>
      </div>
    )
  }
};

export const JsonViewer: Story = {
  name: 'JSON Data Display',
  args: {
    title: 'Debug Data',
    children: (
      <div className="bg-slate-800 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-slate-300">
        {`{
  "worldId": "fantasy-realm",
  "facts": [
    {
      "id": "fact-1",
      "category": "character",
      "importance": "high",
      "content": "Aragorn is the rightful king"
    }
  ],
  "status": "processed"
}`}
      </div>
    )
  }
};

export const WithCustomStyling: Story = {
  name: 'Custom Styling',
  args: {
    title: 'Environment Info',
    className: 'mb-4 text-xs',
    children: (
      <div className="space-y-1">
        <div className="text-slate-300">NODE_ENV: development</div>
        <div className="text-slate-300">Is Client: true</div>
        <div className="text-slate-300">Is Development: true</div>
        <div className="text-slate-300">Window Location: /dev/devtools-test</div>
      </div>
    )
  }
};

export const NestedSections: Story = {
  name: 'Nested Usage',
  args: {
    title: 'Parent Section',
    children: (
      <div className="space-y-3">
        <div className="text-slate-300 text-sm mb-2">This shows how sections can contain other content:</div>
        <DevToolsSection title="Nested Section">
          <div className="text-slate-400 text-xs">Nested content here</div>
        </DevToolsSection>
        <DevToolsSection>
          <div className="text-slate-400 text-xs">Another nested section without title</div>
        </DevToolsSection>
      </div>
    )
  }
};

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    title: 'Empty Section',
    children: (
      <div className="text-xs text-slate-400 italic">
        No data available
      </div>
    )
  }
};