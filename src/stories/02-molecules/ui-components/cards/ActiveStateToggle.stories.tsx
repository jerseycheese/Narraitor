import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ActiveStateToggle } from '@/components/shared/cards/ActiveStateToggle';

const meta = {
  title: '02-Molecules/ui-components/cards/ActiveStateToggle',
  component: ActiveStateToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onActivate: fn(),
  },
} satisfies Meta<typeof ActiveStateToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  args: {
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    isActive: true,
  },
};
