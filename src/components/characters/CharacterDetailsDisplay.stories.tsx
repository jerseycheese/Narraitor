import type { Meta, StoryObj } from '@storybook/react';
import { CharacterDetailsDisplay } from './CharacterDetailsDisplay';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

const meta = {
  title: 'Narraitor/Character/Display/CharacterDetailsDisplay',
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
  theme: 'Fantasy',
  relationship: 'set_in_existing_world',
  worldReference: 'Lord of the Rings',
  attributes: [
    {
      id: 'str',
      name: 'Strength',
      description: 'Physical power and muscle strength',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'dex',
      name: 'Dexterity',
      description: 'Agility and hand-eye coordination',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'int',
      name: 'Intelligence',
      description: 'Reasoning ability and memory',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
      category: 'Mental',
    },
    {
      id: 'wis',
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
      name: 'Swordsmanship',
      description: 'The art of fighting with bladed weapons',
      linkedAttributeId: 'str',
      difficulty: 'Medium',
      category: 'Combat',
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'The ability to move unseen and unheard',
      linkedAttributeId: 'dex',
      difficulty: 'Hard',
      category: 'Utility',
    },
    {
      id: 'lore',
      name: 'Lore',
      description: 'Knowledge of history, magic, and ancient secrets',
      linkedAttributeId: 'int',
      difficulty: 'Easy',
      category: 'Knowledge',
    },
  ],
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

// Mock character data
const mockCharacter: Character = {
  id: 'char-1',
  name: 'Aragorn',
  worldId: 'world-1',
  level: 15,
  attributes: {
    str: 18,
    dex: 14,
    int: 12,
    wis: 16,
  },
  skills: {
    swordsmanship: 15,
    stealth: 8,
    lore: 10,
  },
  background: {
    personality: 'A noble ranger with a strong sense of duty and honor, destined to become king.',
    backstory: 'Raised by elves in Rivendell, trained as a Ranger of the North. He is the rightful heir to the throne of Gondor, though he has spent most of his life wandering the wild lands protecting the innocent.',
    goals: 'To protect Middle-earth from the growing darkness and fulfill his destiny as king.',
    fears: 'Failing to live up to his royal heritage and letting down those who depend on him.',
    motivations: 'Love for his people and a deep sense of responsibility.',
    isKnownFigure: true,
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

export const AttributesOnly: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
    showAttributes: true,
    showSkills: false,
    showBackground: false,
  },
};

export const SkillsOnly: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
    showAttributes: false,
    showSkills: true,
    showBackground: false,
  },
};

export const BackgroundOnly: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
    showAttributes: false,
    showSkills: false,
    showBackground: true,
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
      attributes: {
        str: 10,
        dex: 10,
      },
      skills: {
        swordsmanship: 5,
      },
      background: {
        personality: 'A simple character with basic stats.',
        isKnownFigure: false,
      },
    },
    world: mockWorld,
  },
};

export const PowerfulCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Gandalf the Grey',
      level: 50,
      attributes: {
        str: 12,
        dex: 14,
        int: 20,
        wis: 20,
      },
      skills: {
        lore: 20,
        swordsmanship: 12,
        stealth: 6,
      },
      background: {
        personality: 'A wise and powerful wizard who guides others on their journeys.',
        backstory: 'One of the Istari, sent to Middle-earth to oppose the growing power of darkness. Has walked among mortals for thousands of years, guiding and protecting them.',
        goals: 'To guide the free peoples in their fight against evil and ensure the destruction of the One Ring.',
        fears: 'The corruption of power and failing in his mission.',
        motivations: 'A deep love for Middle-earth and its peoples.',
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};

export const WeakCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Frodo Baggins',
      level: 1,
      attributes: {
        str: 6,
        dex: 12,
        int: 14,
        wis: 16,
      },
      skills: {
        stealth: 8,
        lore: 6,
        swordsmanship: 2,
      },
      background: {
        personality: 'A brave hobbit with a kind heart and unexpected courage.',
        backstory: 'A hobbit from the Shire who inherited a mysterious ring from his cousin Bilbo.',
        goals: 'To destroy the One Ring and save Middle-earth.',
        fears: 'The corruption of the Ring and losing himself to its power.',
        motivations: 'Protecting the Shire and his friends.',
        isKnownFigure: true,
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
      attributes: {
        str: 8,
        dex: 16,
        int: 18,
        wis: 14,
      },
      skills: {
        lore: 12,
        stealth: 10,
        swordsmanship: 4,
      },
      background: {
        personality: 'A mysterious elven mage with a deep connection to nature and ancient magic.',
        backstory: 'Born in the ancient forests of Lothlórien, trained in the old ways of magic by the elven lords.',
        goals: 'To preserve the ancient knowledge and protect the natural world.',
        fears: 'The loss of magic from the world.',
        motivations: 'A sense of duty to her people and the natural world.',
        isKnownFigure: false,
      },
    },
    world: mockWorld,
  },
};

export const LimitedBackground: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Basic Warrior',
      background: {
        personality: 'A straightforward fighter.',
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
        personality: 'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people.',
        backstory: 'Heir to the throne of Erebor, exiled when Smaug took the mountain. Has spent years in exile, dreaming of reclaiming his homeland.',
        goals: 'To reclaim Erebor and restore the Kingdom under the Mountain to its former glory.',
        fears: 'Dying without reclaiming his birthright and leaving his people homeless.',
        motivations: 'Pride in his heritage and love for his people.',
        allies: 'The Company of Thorin Oakenshield, Bilbo Baggins',
        enemies: 'Smaug the Dragon, the goblins of the Misty Mountains',
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};