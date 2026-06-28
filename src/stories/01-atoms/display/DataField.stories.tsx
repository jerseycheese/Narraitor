import { Meta, StoryObj } from '@storybook/react';
import { DataField } from '@/components/shared/DataField/DataField';

const meta: Meta<typeof DataField> = {
  title: '01-Atoms/display/DataField',
  component: DataField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'stacked'] },
  },
};

export default meta;
type Story = StoryObj<typeof DataField>;

export const Default: Story = {
  args: { label: 'Genre', value: 'Dark fantasy' },
};

export const Outline: Story = {
  args: { label: 'Genre', value: 'Dark fantasy', variant: 'outline' },
};

export const Stacked: Story = {
  args: { label: 'Genre', value: 'Dark fantasy', variant: 'stacked' },
};
