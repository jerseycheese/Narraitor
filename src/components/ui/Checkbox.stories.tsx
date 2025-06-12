import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Narraitor/UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    label: {
      control: 'text',
      description: 'Optional label text to display next to the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const WithLabel: Story = {
  args: {
    checked: false,
    label: 'Accept terms and conditions',
  },
};

export const CheckedWithLabel: Story = {
  args: {
    checked: true,
    label: 'Subscribe to newsletter',
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: 'Disabled option',
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled checked option',
  },
};

export const MultipleOptions: Story = {
  render: () => (
    <div className="space-y-3">
      <Checkbox label="Strength" checked={true} />
      <Checkbox label="Intelligence" checked={false} />
      <Checkbox label="Dexterity" checked={true} />
      <Checkbox label="Charisma" checked={false} />
    </div>
  ),
};