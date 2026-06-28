import { Meta, StoryObj } from '@storybook/react';
import { NotFoundState } from '@/components/shared/NotFoundState';

const meta: Meta<typeof NotFoundState> = {
  title: '02-Molecules/ui-components/NotFoundState',
  component: NotFoundState,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NotFoundState>;

export const Default: Story = {
  args: {
    title: 'World not found',
    message: "We couldn't find the world you were looking for. It may have been deleted.",
    backUrl: '/worlds',
    backLabel: 'Back to worlds',
  },
};
