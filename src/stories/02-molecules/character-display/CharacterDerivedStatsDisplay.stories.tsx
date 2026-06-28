import { Meta, StoryObj } from '@storybook/react';
import { CharacterDerivedStatsDisplay } from '@/components/characters/CharacterDerivedStatsDisplay';

const meta: Meta<typeof CharacterDerivedStatsDisplay> = {
  title: '02-Molecules/character-display/CharacterDerivedStatsDisplay',
  component: CharacterDerivedStatsDisplay,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CharacterDerivedStatsDisplay>;

export const Default: Story = {
  args: {
    derivedStats: [
      { id: 'ds-hp', characterId: 'char-1', derivedStatId: 'hp', name: 'Hit Points', currentValue: 38, maxValue: 45, lastCalculated: '2025-01-15T00:00:00Z' },
      { id: 'ds-mp', characterId: 'char-1', derivedStatId: 'mp', name: 'Mana', currentValue: 22, maxValue: 30, lastCalculated: '2025-01-15T00:00:00Z' },
    ],
  },
};
