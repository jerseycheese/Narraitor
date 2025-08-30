// src/components/QuickStartCharacters/QuickStartCharacters.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { QuickStartCharacters } from '@/components/QuickStartCharacters/QuickStartCharacters';
import { World } from '@/components/types/world.types';

const meta: Meta<typeof QuickStartCharacters> = {
  title: '03-Organisms/game-session/setup/QuickStartCharacters',
  component: QuickStartCharacters,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const fantasyWorld: World = {
  id: 'fantasy-world-1',
  name: 'Mystical Realm of Aethros',
  description: 'A magical world filled with ancient forests, towering mountains, and mystical creatures.',
  genre: 'fantasy',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  attributes: [
    { id: 'str', name: 'Strength', description: 'Physical power and might', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'int', name: 'Intelligence', description: 'Mental acuity and reasoning', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'dex', name: 'Dexterity', description: 'Agility and precision', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
  ],
  skills: [
    { id: 'combat', name: 'Combat', description: 'Skill in battle and warfare', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'magic', name: 'Magic', description: 'Understanding of mystical arts', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'stealth', name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 20,
    skillPointPool: 20
  }
};

export const Default: Story = {
  args: {
    world: fantasyWorld,
    existingCharacterNames: [],
  },
};