import { Meta, StoryObj } from '@storybook/react';
import { BackNavigation } from '@/components/shared/BackNavigation';

const meta: Meta<typeof BackNavigation> = {
  title: '01-Atoms/navigation/BackNavigation',
  component: BackNavigation,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Back to worlds', onClick: () => {} },
};

export default meta;
type Story = StoryObj<typeof BackNavigation>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: 'Back to character' },
};
