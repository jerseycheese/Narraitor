import type { Meta, StoryObj } from '@storybook/react';
import { CharacterDetailsDisplay } from '@/components/characters/CharacterDetailsDisplay';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];
import { World } from '@/types/world.types';

const meta = {
  title: '03-Organisms/character/display/CharacterDetailsDisplay',
  component: CharacterDetailsDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    showAttributes: {
      control: 'boolean',
      description: 'Whether to show the attributes section',
    },
    showSkills: {
      control: 'boolean',
      description: 'Whether to show the skills section',
    },
    showBackground: {
      control: 'boolean',
      description: 'Whether to show the background section',
    },
    showCategories: {
      control: 'boolean',
      description: 'Whether to show categories in attribute and skill displays',
    },
  },
} satisfies Meta<typeof CharacterDetailsDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock world data
const mockWorld: World = {
  id: 'world-1',
  name: 'Middle Earth',
  description: 'A fantasy world of magic and adventure',
  genre: 'fantasy',
  relationship: 'set_within',
  reference: 'Lord of the Rings',
  attributes: [
    {
      id: 'str',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Physical power and muscle strength',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'dex',
      worldId: 'world-1',
      name: 'Dexterity',
      description: 'Agility and hand-eye coordination',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'int',
      worldId: 'world-1',
      name: 'Intelligence',
      description: 'Reasoning ability and memory',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Mental',
    },
    {
      id: 'wis',
      worldId: 'world-1',
      name: 'Wisdom',
      description: 'Awareness and insight',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Mental',
    },
  ],
  skills: [
    {
      id: 'swordsmanship',
      worldId: 'world-1',
      name: 'Swordsmanship',
      description: 'The art of fighting with bladed weapons',
      attributeIds: ['str'],
      difficulty: 'medium',
      category: 'Combat',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'stealth',
      worldId: 'world-1',
      name: 'Stealth',
      description: 'The ability to move unseen and unheard',
      attributeIds: ['dex'],
      difficulty: 'hard',
      category: 'Utility',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'lore',
      worldId: 'world-1',
      name: 'Lore',
      description: 'Knowledge of history, magic, and ancient secrets',
      attributeIds: ['int'],
      difficulty: 'easy',
      category: 'Knowledge',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 27,
    skillPointPool: 15,
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

// Mock character data
const mockCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Aragorn',
  description: 'A noble ranger destined to become king',
  worldId: 'world-1',
  level: 15,
  attributes: [
    {
      id: 'char-attr-str',
      characterId: 'char-1',
      worldAttributeId: 'str',
      name: 'Strength',
      baseValue: 18,
      modifiedValue: 18,
      category: 'Physical',
    },
    {
      id: 'char-attr-dex',
      characterId: 'char-1',
      worldAttributeId: 'dex',
      name: 'Dexterity',
      baseValue: 14,
      modifiedValue: 14,
      category: 'Physical',
    },
    {
      id: 'char-attr-int',
      characterId: 'char-1',
      worldAttributeId: 'int',
      name: 'Intelligence',
      baseValue: 12,
      modifiedValue: 12,
      category: 'Mental',
    },
    {
      id: 'char-attr-wis',
      characterId: 'char-1',
      worldAttributeId: 'wis',
      name: 'Wisdom',
      baseValue: 16,
      modifiedValue: 16,
      category: 'Mental',
    },
  ],
  skills: [
    {
      id: 'char-skill-swordsmanship',
      characterId: 'char-1',
      worldSkillId: 'swordsmanship',
      name: 'Swordsmanship',
      level: 15,
      category: 'Combat',
    },
    {
      id: 'char-skill-stealth',
      characterId: 'char-1',
      worldSkillId: 'stealth',
      name: 'Stealth',
      level: 8,
      category: 'Utility',
    },
    {
      id: 'char-skill-lore',
      characterId: 'char-1',
      worldSkillId: 'lore',
      name: 'Lore',
      level: 10,
      category: 'Knowledge',
    },
  ],
  derivedStats: [],
  background: {
    history:
      'Raised by elves in Rivendell, trained as a Ranger of the North. He is the rightful heir to the throne of Gondor, though he has spent most of his life wandering the wild lands protecting the innocent.',
    personality:
      'A noble ranger with a strong sense of duty and honor, destined to become king.',
    goals: [
      'To protect Middle-earth from the growing darkness and fulfill his destiny as king',
    ],
    fears: [
      'Failing to live up to his royal heritage',
      'Letting down those who depend on him',
    ],
    physicalDescription:
      'Tall, dark-haired ranger with weathered features and piercing eyes',
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

export const WithoutCategories: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
    showCategories: false,
  },
};

export const MinimalCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Simple Character',
      attributes: [
        {
          id: 'char-attr-str-simple',
          characterId: 'char-simple',
          worldAttributeId: 'str',
          name: 'Strength',
          baseValue: 10,
          modifiedValue: 10,
          category: 'Physical',
        },
        {
          id: 'char-attr-dex-simple',
          characterId: 'char-simple',
          worldAttributeId: 'dex',
          name: 'Dexterity',
          baseValue: 10,
          modifiedValue: 10,
          category: 'Physical',
        },
      ],
      skills: [
        {
          id: 'char-skill-swordsmanship-simple',
          characterId: 'char-simple',
          worldSkillId: 'swordsmanship',
          name: 'Swordsmanship',
          level: 5,
          category: 'Combat',
        },
      ],
      background: {
        history: 'A simple background with minimal details.',
        personality: 'A simple character with basic stats.',
        goals: [],
        fears: [],
        relationships: [],
        isKnownFigure: false,
      },
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
      attributes: [
        {
          id: 'char-attr-str-lyra',
          characterId: 'char-lyra',
          worldAttributeId: 'str',
          name: 'Strength',
          baseValue: 8,
          modifiedValue: 8,
          category: 'Physical',
        },
        {
          id: 'char-attr-dex-lyra',
          characterId: 'char-lyra',
          worldAttributeId: 'dex',
          name: 'Dexterity',
          baseValue: 16,
          modifiedValue: 16,
          category: 'Physical',
        },
        {
          id: 'char-attr-int-lyra',
          characterId: 'char-lyra',
          worldAttributeId: 'int',
          name: 'Intelligence',
          baseValue: 18,
          modifiedValue: 18,
          category: 'Mental',
        },
        {
          id: 'char-attr-wis-lyra',
          characterId: 'char-lyra',
          worldAttributeId: 'wis',
          name: 'Wisdom',
          baseValue: 14,
          modifiedValue: 14,
          category: 'Mental',
        },
      ],
      skills: [
        {
          id: 'char-skill-lore-lyra',
          characterId: 'char-lyra',
          worldSkillId: 'lore',
          name: 'Lore',
          level: 12,
          category: 'Knowledge',
        },
        {
          id: 'char-skill-stealth-lyra',
          characterId: 'char-lyra',
          worldSkillId: 'stealth',
          name: 'Stealth',
          level: 10,
          category: 'Utility',
        },
        {
          id: 'char-skill-swordsmanship-lyra',
          characterId: 'char-lyra',
          worldSkillId: 'swordsmanship',
          name: 'Swordsmanship',
          level: 4,
          category: 'Combat',
        },
      ],
      background: {
        history:
          'Born in the ancient forests of Lothlórien, trained in the old ways of magic by the elven lords.',
        personality:
          'A mysterious elven mage with a deep connection to nature and ancient magic.',
        goals: [
          'To preserve the ancient knowledge and protect the natural world',
        ],
        fears: ['The loss of magic from the world'],
        physicalDescription: 'Tall elf with flowing robes and mystical aura',
        relationships: [],
        isKnownFigure: false,
      },
    },
    world: mockWorld,
  },
};

export const FullBackground: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Thorin Oakenshield',
      background: {
        history:
          'Heir to the throne of Erebor, exiled when Smaug took the mountain. Has spent years in exile, dreaming of reclaiming his homeland.',
        personality:
          'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people.',
        goals: [
          'To reclaim Erebor and restore the Kingdom under the Mountain to its former glory',
        ],
        fears: [
          'Dying without reclaiming his birthright',
          'Leaving his people homeless',
        ],
        physicalDescription:
          "Proud dwarf king with royal bearing and warrior's build",
        relationships: [],
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};
