import type { Meta, StoryObj } from '@storybook/react';
import { CharacterHeader } from '@/components/characters/CharacterHeader';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';
type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];
import { World } from '@/types/world.types';
const meta = {
  title: '03-Organisms/character/display/CharacterHeader',
  component: CharacterHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CharacterHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
// Mock data
const mockWorld: World = {
  id: 'world-1',
  name: 'Middle Earth',
  description: 'A fantasy world of magic and adventure',
  genre: 'fantasy',
  relationship: 'set_within',
  reference: 'Lord of the Rings',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 27,
    skillPointPool: 15,
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};
const mockCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Aragorn',
  description: 'A noble ranger destined to become king',
  worldId: 'world-1',
  level: 15,
  attributes: [],
  skills: [],
  derivedStats: [],
  background: {
    history: 'Raised by elves in Rivendell, trained as a Ranger of the North.',
    personality:
      'A noble ranger with a strong sense of duty and honor, destined to become king.',
    goals: ['Become king of Gondor'],
    fears: ['Failing his people'],
    physicalDescription: 'Tall, dark-haired ranger with weathered features',
    relationships: [],
    isKnownFigure: true,
  },
  isPlayer: true,
  status: {
    conditions: [],
  },
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 20,
    categories: [],
    itemOrder: [],
  },
  portrait: {
    type: 'ai-generated',
    url: 'https://i.pravatar.cc/200?img=1',
    prompt: 'A noble ranger with weathered features and kind eyes',
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};
export const Default: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
  },
};
export const WithoutPortrait: Story = {
  args: {
    character: {
      ...mockCharacter,
      portrait: undefined,
    },
    world: mockWorld,
  },
};
export const OriginalCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      id: 'char-2',
      name: 'Lyra Moonwhisper',
      level: 8,
      background: {
        history:
          'Born in the ancient forests, trained in the old ways of magic.',
        personality:
          'A mysterious elven mage with a deep connection to nature and ancient magic.',
        goals: ['Master ancient magic'],
        fears: ['Loss of nature'],
        physicalDescription: 'Tall elf with flowing robes and mystical aura',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://i.pravatar.cc/200?img=2',
        prompt: 'An elven mage with flowing silver hair and mystical aura',
      },
    },
    world: {
      ...mockWorld,
      name: 'Aethermoor',
      description:
        'A magical realm where the boundaries between worlds are thin',
    },
  },
};
export const LongPersonality: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Thorin Oakenshield',
      background: {
        history:
          'Heir to the throne of Erebor, exiled when Smaug took the mountain.',
        personality:
          'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people. Driven by a desire to reclaim his ancestral home and restore the glory of the Kingdom under the Mountain. Can be both noble and petty, brave and reckless, wise and foolish. His pride often leads him into conflict, but his heart is ultimately in the right place.',
        goals: ['Reclaim Erebor'],
        fears: ['Failing his people'],
        physicalDescription:
          "Proud dwarf king with royal bearing and warrior's build",
        relationships: [],
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};
export const SciFiCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Commander Nova',
      level: 25,
      background: {
        history: 'Former military officer turned space explorer.',
        personality:
          'A tactical genius with cybernetic enhancements and unwavering determination.',
        goals: ['Explore the galaxy'],
        fears: ['System failures'],
        physicalDescription: 'Cybernetically enhanced human with tactical gear',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://i.pravatar.cc/200?img=4',
        prompt: 'A futuristic commander with tactical gear and determined look',
      },
    },
    world: {
      ...mockWorld,
      name: 'New Terra',
      description: 'A futuristic colony on a distant planet',
      genre: 'fantasy',
    },
  },
};
