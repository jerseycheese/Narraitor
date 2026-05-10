import type { Meta, StoryObj } from '@storybook/react';
import { DashboardGettingStarted } from '@/components/Dashboard/DashboardGettingStarted';

const meta: Meta<typeof DashboardGettingStarted> = {
  title: '03-Organisms/dashboard/DashboardGettingStarted',
  component: DashboardGettingStarted,
  parameters: {
    layout: 'padded',
  },
  args: {
    onNavigate: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoneComplete: Story = {
  args: { hasWorlds: false, hasCharacters: false, hasSessions: false },
};

export const WorldOnly: Story = {
  args: { hasWorlds: true, hasCharacters: false, hasSessions: false },
};

export const WorldAndCharacter: Story = {
  args: { hasWorlds: true, hasCharacters: true, hasSessions: false },
};

export const AllComplete: Story = {
  name: 'All Complete (Ready to Continue)',
  args: { hasWorlds: true, hasCharacters: true, hasSessions: true },
};
