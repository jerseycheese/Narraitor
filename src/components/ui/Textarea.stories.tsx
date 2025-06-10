import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';
import { Label } from './label';

const meta: Meta<typeof Textarea> = {
  title: 'Narraitor/UI/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: 'A styled textarea component following shadcn/ui design patterns with proper focus states and accessibility.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
  },
  args: {
    placeholder: 'Enter description...',
    rows: 3,
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Describe your character...',
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="description-textarea">Character Description</Label>
      <Textarea id="description-textarea" {...args} />
    </div>
  ),
  args: {
    placeholder: 'Describe your character&apos;s background and personality...',
    rows: 4,
  },
};

export const WithError: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="error-textarea">Character Background</Label>
      <Textarea 
        id="error-textarea" 
        {...args} 
        className="border-red-300 focus-visible:ring-red-500" 
      />
      <p className="text-red-600 text-sm">Background must be at least 50 characters</p>
    </div>
  ),
  args: {
    placeholder: 'Enter character background...',
    value: 'Too short',
    rows: 4,
  },
};

export const WithHelpText: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="help-textarea">Physical Description</Label>
      <Textarea id="help-textarea" {...args} />
      <p className="text-gray-500 text-sm">
        This will be used to generate your character&apos;s portrait. 
        Tip: Add &quot;looks like [actor name]&quot; for specific appearance.
      </p>
    </div>
  ),
  args: {
    placeholder: 'Describe your character&apos;s appearance...',
    rows: 3,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
    value: 'This textarea is disabled and cannot be edited.',
    rows: 3,
  },
};

export const LargeTextarea: Story = {
  args: {
    placeholder: 'Enter a detailed backstory...',
    rows: 8,
  },
};