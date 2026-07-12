import type { Meta, StoryObj } from '@storybook/react';
import { GameSessionSkeleton } from '@/components/GameSession/GameSessionSkeleton';

const meta = {
  title: '03-Organisms/Game Session/GameSessionSkeleton',
  component: GameSessionSkeleton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading skeleton shown while the first narrative segment generates. ' +
          'Use the color-mode toolbar to verify the skeleton in light and dark.',
      },
    },
  },
} satisfies Meta<typeof GameSessionSkeleton>;

export default meta;
type Story = StoryObj<typeof GameSessionSkeleton>;

export const Default: Story = {};
