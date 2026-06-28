import { Meta, StoryObj } from '@storybook/react';
import { ActiveStateIndicator } from '@/components/shared/cards/ActiveStateIndicator';

const meta: Meta<typeof ActiveStateIndicator> = {
  title: '01-Atoms/feedback/ActiveStateIndicator',
  component: ActiveStateIndicator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: { text: { control: 'text' } },
};

export default meta;
type Story = StoryObj<typeof ActiveStateIndicator>;

export const Default: Story = {};

export const CustomText: Story = {
  args: { text: 'Now playing' },
};
