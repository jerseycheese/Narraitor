import type { Meta, StoryObj } from '@storybook/react';
import GameSessionLoading from '@/components/GameSession/GameSessionLoading';

const meta = {
  title: '03-Organisms/Game Session/GameSessionLoading',
  component: GameSessionLoading,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof GameSessionLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    loadingMessage: 'Preparing your adventure...',
  },
};
