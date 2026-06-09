import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta: Meta<typeof Input> = {
  title: '01-Atoms/forms/inputs/Input',
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
    'aria-label': 'Name',
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div>
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
    <div>
      <Label htmlFor="error-input">Character Name <span>*</span></Label>
      <Input 
        id="error-input" 
        {...args} 
         
      />
      <p>Character name is required</p>
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
    'aria-label': 'Disabled field',
  },
};

export const Types: Story = {
  render: () => (
    <div>
      <div>
        <Label htmlFor="text-input">Text Input</Label>
        <Input id="text-input" type="text" placeholder="Enter text" />
      </div>
      <div>
        <Label htmlFor="email-input">Email Input</Label>
        <Input id="email-input" type="email" placeholder="Enter email" />
      </div>
      <div>
        <Label htmlFor="password-input">Password Input</Label>
        <Input id="password-input" type="password" placeholder="Enter password" />
      </div>
      <div>
        <Label htmlFor="number-input">Number Input</Label>
        <Input id="number-input" type="number" placeholder="Enter number" />
      </div>
    </div>
  ),
};