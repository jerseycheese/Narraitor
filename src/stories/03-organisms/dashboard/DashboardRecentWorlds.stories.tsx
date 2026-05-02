import type { Meta, StoryObj } from '@storybook/react';
import { DashboardRecentWorlds } from '@/components/Dashboard/DashboardRecentWorlds';
import { mockWorldA, mockWorldB } from '@/components/Dashboard/DashboardHome.stories.helpers';

const thirdWorld = {
  ...mockWorldA,
  id: 'world-3',
  name: 'Old Tannery Lane',
  genre: 'historical' as const,
};

const meta: Meta<typeof DashboardRecentWorlds> = {
  title: '03-Organisms/dashboard/DashboardRecentWorlds',
  component: DashboardRecentWorlds,
  parameters: {
    layout: 'padded',
  },
  args: {
    maxItems: 3,
    onNavigate: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { worlds: {} },
};

export const Partial: Story = {
  name: 'Partial (1 world + empty slots)',
  args: { worlds: { [mockWorldA.id]: mockWorldA } },
};

export const Full: Story = {
  args: {
    worlds: {
      [mockWorldA.id]: mockWorldA,
      [mockWorldB.id]: mockWorldB,
      [thirdWorld.id]: thirdWorld,
    },
  },
};
