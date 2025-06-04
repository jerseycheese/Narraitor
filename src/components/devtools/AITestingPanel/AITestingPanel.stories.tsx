import type { Meta, StoryObj } from '@storybook/react';
import { AITestingPanel } from './AITestingPanel';

const meta: Meta<typeof AITestingPanel> = {
  title: 'Narraitor/DevTools/Panels/AITestingPanel',
  component: AITestingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The AI Testing Panel is a development tool that allows developers to test narrative generation 
with custom inputs. It provides form controls to override world, character, and narrative 
context for testing purposes.

**Key Features:**
- World context override (name, theme)
- Character context override (name)
- Mock AI narrative generation
- Request/response logging
- Dark theme styling for DevTools integration

**Usage:**
This component is designed to be used within the DevTools panel during development. 
It allows developers to quickly test different scenarios without creating full world/character data.
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="bg-slate-800 p-4 text-slate-200">
        <div style={{ maxWidth: '600px' }}>
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
 * Interactive example showing the complete workflow
 */
export const InteractiveExample: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the complete workflow:

1. **Fill World Override**: Enter "Fantasy Realm" as world name and "High Fantasy" as theme
2. **Fill Character Override**: Enter "Adventurer" as character name  
3. **Generate Narrative**: Click the button to see mock AI response
4. **Review Results**: Check the generated narrative and choices

The component includes proper error handling and loading states for a complete developer experience.
        `
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
      <div className="bg-slate-800 p-2 text-slate-200">
        <div style={{ maxWidth: '400px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows how the panel adapts to smaller container sizes.'
      }
    }
  }
};
