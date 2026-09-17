import type { Meta, StoryObj } from '@storybook/react';
import { ActiveStateLabel } from '@/components/shared/cards/ActiveStateLabel';

const meta = {
  title: '02-Molecules/ui-components/cards/ActiveStateLabel',
  component: ActiveStateLabel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActiveStateLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    isActive: true,
  },
};
