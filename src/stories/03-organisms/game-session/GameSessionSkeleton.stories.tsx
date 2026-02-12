import type { Meta, StoryObj } from '@storybook/react';
import { GameSessionSkeleton } from '@/components/GameSession/GameSessionSkeleton';

const meta: Meta<typeof GameSessionSkeleton> = {
  title: '03-Organisms/GameSession/GameSessionSkeleton',
  component: GameSessionSkeleton,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GameSessionSkeleton>;

export const Default: Story = {};
