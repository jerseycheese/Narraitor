import type { Meta, StoryObj } from '@storybook/react';
import { DashboardRecentCharacters } from '@/components/Dashboard/DashboardRecentCharacters';
import {
  mockWorldA,
  mockWorldB,
  mockCharacterA,
  mockCharacterB,
} from '@/components/Dashboard/DashboardHome.stories.helpers';

const thirdCharacter = {
  ...mockCharacterA,
  id: 'char-3',
  worldId: mockWorldB.id,
  name: 'Lyric',
};

const sharedWorlds = {
  [mockWorldA.id]: mockWorldA,
  [mockWorldB.id]: mockWorldB,
};

const meta: Meta<typeof DashboardRecentCharacters> = {
  title: '03-Organisms/dashboard/DashboardRecentCharacters',
  component: DashboardRecentCharacters,
  parameters: {
    layout: 'padded',
  },
  args: {
    maxItems: 3,
    worlds: sharedWorlds,
    onNavigate: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { characters: {} },
};

export const Partial: Story = {
  name: 'Partial (1 character + empty slots)',
  args: { characters: { [mockCharacterA.id]: mockCharacterA } },
};

export const Full: Story = {
  args: {
    characters: {
      [mockCharacterA.id]: mockCharacterA,
      [mockCharacterB.id]: mockCharacterB,
      [thirdCharacter.id]: thirdCharacter,
    },
  },
};
