import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'Narraitor/UI/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: 'A styled input component following shadcn/ui design patterns with proper focus states and accessibility.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
  args: {
    placeholder: 'Enter text...',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="name-input">Character Name</Label>
      <Input id="name-input" {...args} />
    </div>
  ),
  args: {
    placeholder: 'Enter character name',
  },
};

export const WithError: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="error-input">Character Name</Label>
      <Input 
        id="error-input" 
        {...args} 
        className="border-red-300 focus-visible:ring-red-500" 
      />
      <p className="text-red-600 text-sm">Character name is required</p>
    </div>
  ),
  args: {
    placeholder: 'Enter character name',
    value: '',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    value: 'This input is disabled',
  },
};

export const Types: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Text Input</Label>
        <Input type="text" placeholder="Enter text" />
      </div>
      <div className="space-y-2">
        <Label>Email Input</Label>
        <Input type="email" placeholder="Enter email" />
      </div>
      <div className="space-y-2">
        <Label>Password Input</Label>
        <Input type="password" placeholder="Enter password" />
      </div>
      <div className="space-y-2">
        <Label>Number Input</Label>
        <Input type="number" placeholder="Enter number" />
      </div>
    </div>
  ),
};