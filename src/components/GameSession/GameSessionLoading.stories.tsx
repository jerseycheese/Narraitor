import type { Meta, StoryObj } from '@storybook/react';
import GameSessionLoading from './GameSessionLoading';

const meta: Meta<typeof GameSessionLoading> = {
  title: 'Narraitor/Game/Session/GameSessionLoading',
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

export const CustomMessage: Story = {
  args: {
    loadingMessage: 'Preparing your adventure...',
  },
};

export const InitializingMessage: Story = {
  args: {
    loadingMessage: 'Initializing game world...',
  },
};

export const GeneratingMessage: Story = {
  args: {
    loadingMessage: 'Generating narrative...',
  },
};