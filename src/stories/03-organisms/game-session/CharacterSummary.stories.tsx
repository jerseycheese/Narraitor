import type { Meta, StoryObj } from '@storybook/react';
import CharacterSummary from '@/components/GameSession/CharacterSummary';
import { mockCharacter, WithMockWorldStore } from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/CharacterSummary',
  component: CharacterSummary,
  parameters: {
    layout: 'padded',
  },
  decorators: [WithMockWorldStore],
} satisfies Meta<typeof CharacterSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    character: mockCharacter as never,
  },
};

export const Expanded: Story = {
  args: {
    character: mockCharacter as never,
    initialExpanded: true,
  },
};

export const DrawerVariant: Story = {
  args: {
    character: mockCharacter as never,
    variant: 'drawer',
  },
};

export const WithAllDetails: Story = {
  args: {
    character: {
      ...mockCharacter,
      derivedStats: [
        { id: 'ds-hp', name: 'Hit Points', currentValue: 38, maxValue: 45 },
        { id: 'ds-mp', name: 'Mana', currentValue: 22, maxValue: 30 },
      ],
      status: {
        conditions: ['Arcane Focus', 'Fatigued'],
        location: 'Thornhaven Docks',
      },
    } as never,
    variant: 'drawer',
  },
};
