import type { Meta, StoryObj } from '@storybook/react';
import { WorldDetailsDisplay } from './WorldDetailsDisplay';
import { World } from '@/types/world.types';

const meta = {
  title: 'Narraitor/World/Display/WorldDetailsDisplay',
  component: WorldDetailsDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    showDescription: {
      control: 'boolean',
      description: 'Whether to show the description section',
    },
    showSettings: {
      control: 'boolean',
      description: 'Whether to show the settings section',
    },
    showInfo: {
      control: 'boolean',
      description: 'Whether to show the info section',
    },
  },
} satisfies Meta<typeof WorldDetailsDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock world data
const mockWorld: World = {
  id: 'world-1',
  name: 'Middle Earth',
  description: 'A vast and mystical realm where magic flows through every living thing. Ancient forests hold secrets of the old gods, while towering mountains guard hidden valleys where legendary creatures dwell. This world is filled with wonder and danger in equal measure, where heroes are forged in the crucible of adventure and legends are born from acts of courage.',
  theme: 'Fantasy',
  relationship: 'set_in',
  reference: 'Lord of the Rings',
  attributes: [
    {
      id: 'str',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Raw physical power and muscle',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'dex',
      worldId: 'world-1',
      name: 'Dexterity',
      description: 'Agility, reflexes, and hand-eye coordination',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'con',
      worldId: 'world-1',
      name: 'Constitution',
      description: 'Health, stamina, and vitality',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Physical',
    },
    {
      id: 'int',
      worldId: 'world-1',
      name: 'Intelligence',
      description: 'Reasoning ability, memory, and analytical skill',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Mental',
    },
    {
      id: 'wis',
      worldId: 'world-1',
      name: 'Wisdom',
      description: 'Awareness, intuition, and insight',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Mental',
    },
    {
      id: 'cha',
      worldId: 'world-1',
      name: 'Charisma',
      description: 'Force of personality, persuasiveness, and leadership',
      minValue: 3,
      maxValue: 18,
      baseValue: 10,
      category: 'Social',
    },
  ],
  skills: [
    {
      id: 'swordsmanship',
      worldId: 'world-1',
      name: 'Swordsmanship',
      description: 'Mastery of blade combat and weapon techniques',
      attributeIds: ['str'],
      difficulty: 'medium',
      category: 'Combat',
      minValue: 1,
      maxValue: 20,
      baseValue: 5,
    },
    {
      id: 'archery',
      worldId: 'world-1',
      name: 'Archery',
      description: 'Precision shooting with bow and arrow',
      attributeIds: ['dex'],
      difficulty: 'medium',
      category: 'Combat',
      minValue: 1,
      maxValue: 20,
      baseValue: 5,
    },
    {
      id: 'magic',
      worldId: 'world-1',
      name: 'Arcane Magic',
      description: 'Manipulation of mystical forces and spellcasting',
      attributeIds: ['int'],
      difficulty: 'hard',
      category: 'Mystical',
      minValue: 1,
      maxValue: 20,
      baseValue: 2,
    },
    {
      id: 'divine_magic',
      worldId: 'world-1',
      name: 'Divine Magic',
      description: 'Channeling divine power for healing and protection',
      attributeIds: ['wis'],
      difficulty: 'hard',
      category: 'Mystical',
      minValue: 1,
      maxValue: 20,
      baseValue: 3,
    },
    {
      id: 'stealth',
      worldId: 'world-1',
      name: 'Stealth',
      description: 'Moving silently and remaining hidden',
      attributeIds: ['dex'],
      difficulty: 'hard',
      category: 'Utility',
      minValue: 1,
      maxValue: 20,
      baseValue: 3,
    },
    {
      id: 'lore',
      worldId: 'world-1',
      name: 'Ancient Lore',
      description: 'Knowledge of history, legends, and forgotten secrets',
      attributeIds: ['int'],
      difficulty: 'medium',
      category: 'Knowledge',
      minValue: 1,
      maxValue: 20,
      baseValue: 5,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 27,
    skillPointPool: 15,
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

export const Default: Story = {
  args: {
    world: mockWorld,
  },
};

export const DescriptionOnly: Story = {
  args: {
    world: mockWorld,
    showDescription: true,
    showSettings: false,
    showInfo: false,
  },
};

export const WithoutDescription: Story = {
  args: {
    world: mockWorld,
    showDescription: false,
    showSettings: true,
    showInfo: true,
  },
};

export const SettingsOnly: Story = {
  args: {
    world: mockWorld,
    showDescription: false,
    showSettings: true,
    showInfo: false,
  },
};

export const InfoOnly: Story = {
  args: {
    world: mockWorld,
    showDescription: false,
    showSettings: false,
    showInfo: true,
  },
};

export const MinimalWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Simple World',
      description: 'A basic world with minimal configuration.',
      attributes: [
        {
          id: 'power',
          worldId: 'world-simple',
          name: 'Power Level',
          description: 'Overall character strength',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
        },
      ],
      skills: [
        {
          id: 'combat',
          worldId: 'world-simple',
          name: 'Combat',
          description: 'Fighting ability',
          attributeIds: ['power'],
          difficulty: 'medium',
          category: 'Combat',
          minValue: 1,
          maxValue: 10,
          baseValue: 3,
        },
      ],
      settings: {
        maxAttributes: 1,
        maxSkills: 3,
        attributePointPool: 10,
        skillPointPool: 5,
      },
    },
  },
};

export const SciFiWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'New Tokyo 2087',
      description: 'A cyberpunk metropolis where technology and humanity collide. Neon lights pierce through perpetual smog while corporate towers scrape the polluted sky. In the shadows of this urban jungle, hackers, augmented humans, and AI entities struggle for control of the digital realm.',
      theme: 'Cyberpunk',
      relationship: 'based_on',
      reference: 'Blade Runner / Ghost in the Shell',
      attributes: [
        {
          id: 'body',
          worldId: 'world-cyberpunk',
          name: 'Body',
          description: 'Physical conditioning and augmentations',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
          category: 'Physical',
        },
        {
          id: 'mind',
          worldId: 'world-cyberpunk',
          name: 'Mind',
          description: 'Neural processing and cybernetic interfaces',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
          category: 'Mental',
        },
        {
          id: 'tech',
          worldId: 'world-cyberpunk',
          name: 'Tech',
          description: 'Technology integration and hacking ability',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
          category: 'Technical',
        },
        {
          id: 'edge',
          worldId: 'world-cyberpunk',
          name: 'Edge',
          description: 'Street credibility and network connections',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
          category: 'Social',
        },
      ],
      skills: [
        {
          id: 'hacking',
          worldId: 'world-cyberpunk',
          name: 'System Hacking',
          description: 'Breaking into computer systems and networks',
          attributeIds: ['tech'],
          difficulty: 'hard',
          category: 'Technical',
          minValue: 1,
          maxValue: 10,
          baseValue: 2,
        },
        {
          id: 'cybercombat',
          worldId: 'world-cyberpunk',
          name: 'Cyber Combat',
          description: 'Fighting in virtual and augmented reality',
          attributeIds: ['mind'],
          difficulty: 'hard',
          category: 'Combat',
          minValue: 1,
          maxValue: 10,
          baseValue: 3,
        },
        {
          id: 'street_knowledge',
          worldId: 'world-cyberpunk',
          name: 'Street Knowledge',
          description: 'Understanding the urban underground',
          attributeIds: ['edge'],
          difficulty: 'medium',
          category: 'Social',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
        },
      ],
      settings: {
        maxAttributes: 4,
        maxSkills: 8,
        attributePointPool: 20,
        skillPointPool: 12,
      },
    },
  },
};

export const OriginalWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Aethermoor',
      description: 'A realm where the boundaries between dimensions are thin, allowing magic from multiple realities to bleed through. Floating islands drift through endless skies, connected by bridges of crystallized starlight. Here, the laws of physics bend to the will of those who understand the deeper mysteries of existence.',
      relationship: undefined,
      reference: undefined,
      attributes: [
        {
          id: 'essence',
          worldId: 'world-original',
          name: 'Essence',
          description: 'Connection to dimensional energy',
          minValue: 1,
          maxValue: 20,
          baseValue: 8,
          category: 'Mystical',
        },
        {
          id: 'focus',
          worldId: 'world-original',
          name: 'Focus',
          description: 'Mental clarity and concentration',
          minValue: 1,
          maxValue: 20,
          baseValue: 8,
          category: 'Mental',
        },
        {
          id: 'stability',
          worldId: 'world-original',
          name: 'Stability',
          description: 'Resistance to dimensional flux',
          minValue: 1,
          maxValue: 20,
          baseValue: 8,
          category: 'Physical',
        },
      ],
      skills: [
        {
          id: 'dimensional_magic',
          worldId: 'world-original',
          name: 'Dimensional Magic',
          description: 'Manipulating the fabric of reality',
          attributeIds: ['essence'],
          difficulty: 'hard',
          category: 'Mystical',
          minValue: 1,
          maxValue: 20,
          baseValue: 2,
        },
        {
          id: 'reality_anchor',
          worldId: 'world-original',
          name: 'Reality Anchoring',
          description: 'Maintaining stability in flux zones',
          attributeIds: ['stability'],
          difficulty: 'hard',
          category: 'Survival',
          minValue: 1,
          maxValue: 20,
          baseValue: 3,
        },
      ],
      settings: {
        maxAttributes: 5,
        maxSkills: 10,
        attributePointPool: 30,
        skillPointPool: 20,
      },
    },
  },
};

export const EmptyWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Blank Slate',
      description: 'A world template with no attributes or skills defined yet.',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 15,
      },
    },
  },
};

export const LongDescription: Story = {
  args: {
    world: {
      ...mockWorld,
      description: 'This is an incredibly detailed world with a very long description that spans multiple paragraphs and contains extensive lore and background information. The world has been carefully crafted over many years, with intricate political systems, complex magical laws, and a rich history that spans millennia. Every aspect of this realm has been considered, from the smallest village customs to the grandest cosmic forces that shape reality itself. The description continues on and on, providing readers with a comprehensive understanding of this fantastical realm and all its wonders. It includes details about the various races that inhabit the world, their cultures, their conflicts, and their alliances. The magical system is particularly well-developed, with specific rules governing how different types of magic interact with each other and with the physical world.',
    },
  },
};
