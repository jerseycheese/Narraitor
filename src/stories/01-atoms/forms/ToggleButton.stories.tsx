import { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from '@/components/shared/wizard/components/ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: '01-Atoms/forms/ToggleButton',
  component: ToggleButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { isActive: true, onClick: () => {} },
  argTypes: { isActive: { control: 'boolean' }, disabled: { control: 'boolean' } },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Active: Story = { args: { isActive: true } };
export const Inactive: Story = { args: { isActive: false } };
export const Disabled: Story = { args: { disabled: true } };
