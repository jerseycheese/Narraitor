import type { Meta, StoryObj } from '@storybook/react';
import GameSessionLoading from '@/components/GameSession/GameSessionLoading';

const meta: Meta<typeof GameSessionLoading> = {
  title: '05-Pages/game-session/GameSessionLoading',
  component: GameSessionLoading,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomMessage: Story = {
  args: {
    loadingMessage: 'Preparing your adventure...',
  },
};
