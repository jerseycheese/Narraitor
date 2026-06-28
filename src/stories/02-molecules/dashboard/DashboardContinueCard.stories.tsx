import { Meta, StoryObj } from '@storybook/react';
import { DashboardContinueCard } from '@/components/Dashboard/DashboardContinueCard';
import { mockWorldA, mockCharacterA } from '@/components/Dashboard/DashboardHome.stories.helpers';

const meta: Meta<typeof DashboardContinueCard> = {
  title: '02-Molecules/dashboard/DashboardContinueCard',
  component: DashboardContinueCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DashboardContinueCard>;

export const Default: Story = {
  args: {
    session: {
      id: 'session-1',
      worldId: mockWorldA.id,
      characterId: mockCharacterA.id,
      lastPlayed: '2025-06-14T18:30:00Z',
      narrativeCount: 12,
    },
    world: mockWorldA,
    character: mockCharacterA,
    onContinue: () => {},
    onDelete: () => {},
  },
};
