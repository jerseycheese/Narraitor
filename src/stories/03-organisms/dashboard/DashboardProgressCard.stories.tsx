import type { Meta, StoryObj } from '@storybook/react';
import { DashboardProgressCard } from '@/components/Dashboard/DashboardProgressCard';

const meta: Meta<typeof DashboardProgressCard> = {
  title: '03-Organisms/dashboard/DashboardProgressCard',
  component: DashboardProgressCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    metrics: {
      worldsCreated: 0,
      charactersCreated: 0,
      sessionsPlayed: 0,
      narrativeSegments: 0,
    },
  },
};

export const Mixed: Story = {
  args: {
    metrics: {
      worldsCreated: 2,
      charactersCreated: 3,
      sessionsPlayed: 1,
      narrativeSegments: 14,
    },
  },
};

export const HighCounts: Story = {
  args: {
    metrics: {
      worldsCreated: 12,
      charactersCreated: 27,
      sessionsPlayed: 9,
      narrativeSegments: 348,
    },
  },
};
