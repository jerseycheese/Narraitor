import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import GameSessionResume from '@/components/GameSession/GameSessionResume';
import type { SavedSessionInfo } from '@/types/game.types';
import { mockSavedSession } from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/GameSessionResume',
  component: GameSessionResume,
  parameters: {
    layout: 'padded',
  },
  args: {
    onResume: fn(),
    onNewGame: fn(),
  },
} satisfies Meta<typeof GameSessionResume>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    savedSession: { ...mockSavedSession, narrativeCount: 12 },
  },
};

export const RecentSession: Story = {
  args: {
    savedSession: {
      ...mockSavedSession,
      lastPlayed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      narrativeCount: 3,
    } satisfies SavedSessionInfo,
  },
};

export const LongProgress: Story = {
  args: {
    savedSession: { ...mockSavedSession, narrativeCount: 87 },
  },
};
