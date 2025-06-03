import type { Meta, StoryObj } from '@storybook/react';
import { WorldSkillsList } from './WorldSkillsList';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

const meta = {
  title: 'Narraitor/World/Display/WorldSkillsList',
  component: WorldSkillsList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldSkillsList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock attributes for linking
const mockAttributes: WorldAttribute[] = [
  {
    id: 'str',
    name: 'Strength',
    description: 'Physical power',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Physical',
  },
  {
    id: 'dex',
    name: 'Dexterity',
    description: 'Agility',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Physical',
  },
  {
    id: 'int',
    name: 'Intelligence',
    description: 'Mental acuity',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Mental',
  },
  {
    id: 'wis',
    name: 'Wisdom',
    description: 'Awareness',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Mental',
  },
];

// Mock skills
const mockSkills: WorldSkill[] = [
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
  {
    id: 'perception',
    name: 'Perception',
    description: 'Noticing details and hidden things',
    linkedAttributeId: 'wis',
    difficulty: 'Medium',
    category: 'Utility',
  },
];

export const Default: Story = {
  args: {
    skills: mockSkills,
    attributes: mockAttributes,
  },
};

export const MinimalSkills: Story = {
  args: {
    skills: [
      {
        id: 'combat',
        name: 'Combat',
        description: 'Fighting ability',
        linkedAttributeId: 'str',
        difficulty: 'Medium',
        category: 'Combat',
      },
      {
        id: 'magic',
        name: 'Magic',
        description: 'Spellcasting ability',
        linkedAttributeId: 'int',
        difficulty: 'Hard',
        category: 'Mystical',
      },
    ],
    attributes: mockAttributes,
  },
};

export const WithoutDescriptions: Story = {
  args: {
    skills: [
      {
        id: 'swordsmanship',
        name: 'Swordsmanship',
        linkedAttributeId: 'str',
        difficulty: 'Medium',
        category: 'Combat',
      },
      {
        id: 'stealth',
        name: 'Stealth',
        linkedAttributeId: 'dex',
        difficulty: 'Hard',
        category: 'Utility',
      },
    ],
    attributes: mockAttributes,
  },
};

export const WithoutLinkedAttributes: Story = {
  args: {
    skills: [
      {
        id: 'leadership',
        name: 'Leadership',
        description: 'Ability to inspire and command others',
        difficulty: 'Hard',
        category: 'Social',
      },
      {
        id: 'survival',
        name: 'Survival',
        description: 'Living off the land and in harsh conditions',
        difficulty: 'Medium',
        category: 'Utility',
      },
    ],
    attributes: mockAttributes,
  },
};

export const Fantasy: Story = {
  args: {
    skills: [
      {
        id: 'swordsmanship',
        name: 'Swordsmanship',
        description: 'Mastery of blade combat and weapon techniques',
        linkedAttributeId: 'str',
        difficulty: 'Medium',
        category: 'Combat',
      },
      {
        id: 'archery',
        name: 'Archery',
        description: 'Precision shooting with bow and arrow',
        linkedAttributeId: 'dex',
        difficulty: 'Medium',
        category: 'Combat',
      },
      {
        id: 'magic',
        name: 'Arcane Magic',
        description: 'Manipulation of mystical forces and spellcasting',
        linkedAttributeId: 'int',
        difficulty: 'Very Hard',
        category: 'Mystical',
      },
      {
        id: 'divine_magic',
        name: 'Divine Magic',
        description: 'Channeling divine power for healing and protection',
        linkedAttributeId: 'wis',
        difficulty: 'Hard',
        category: 'Mystical',
      },
      {
        id: 'stealth',
        name: 'Stealth',
        description: 'Moving silently and remaining hidden',
        linkedAttributeId: 'dex',
        difficulty: 'Hard',
        category: 'Utility',
      },
      {
        id: 'lore',
        name: 'Ancient Lore',
        description: 'Knowledge of history, legends, and forgotten secrets',
        linkedAttributeId: 'int',
        difficulty: 'Medium',
        category: 'Knowledge',
      },
    ],
    attributes: mockAttributes,
  },
};

export const SciFi: Story = {
  args: {
    skills: [
      {
        id: 'piloting',
        name: 'Spacecraft Piloting',
        description: 'Operating various types of spacecraft and vehicles',
        linkedAttributeId: 'dex',
        difficulty: 'Hard',
        category: 'Technical',
      },
      {
        id: 'hacking',
        name: 'System Hacking',
        description: 'Breaking into computer systems and networks',
        linkedAttributeId: 'int',
        difficulty: 'Very Hard',
        category: 'Technical',
      },
      {
        id: 'cybercombat',
        name: 'Cyber Combat',
        description: 'Fighting in virtual and augmented reality',
        linkedAttributeId: 'int',
        difficulty: 'Hard',
        category: 'Combat',
      },
      {
        id: 'engineering',
        name: 'Engineering',
        description: 'Design and maintenance of advanced technology',
        linkedAttributeId: 'int',
        difficulty: 'Medium',
        category: 'Technical',
      },
    ],
    attributes: [
      {
        id: 'body',
        name: 'Body',
        description: 'Physical conditioning',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
      {
        id: 'mind',
        name: 'Mind',
        description: 'Neural processing',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
      {
        id: 'tech',
        name: 'Tech',
        description: 'Technology integration',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
    ],
  },
};

export const VariedDifficulties: Story = {
  args: {
    skills: [
      {
        id: 'walking',
        name: 'Walking',
        description: 'Basic movement on foot',
        linkedAttributeId: 'str',
        difficulty: 'Very Easy',
        category: 'Basic',
      },
      {
        id: 'reading',
        name: 'Reading',
        description: 'Understanding written text',
        linkedAttributeId: 'int',
        difficulty: 'Easy',
        category: 'Basic',
      },
      {
        id: 'cooking',
        name: 'Cooking',
        description: 'Preparing meals and food',
        linkedAttributeId: 'dex',
        difficulty: 'Medium',
        category: 'Craft',
      },
      {
        id: 'surgery',
        name: 'Surgery',
        description: 'Advanced medical procedures',
        linkedAttributeId: 'dex',
        difficulty: 'Hard',
        category: 'Medical',
      },
      {
        id: 'time_travel',
        name: 'Time Travel',
        description: 'Manipulating the flow of time itself',
        linkedAttributeId: 'int',
        difficulty: 'Very Hard',
        category: 'Mystical',
      },
    ],
    attributes: mockAttributes,
  },
};

export const Empty: Story = {
  args: {
    skills: [],
    attributes: mockAttributes,
  },
};

export const SingleSkill: Story = {
  args: {
    skills: [
      {
        id: 'ultimate_power',
        name: 'Ultimate Power',
        description: 'The ability to do anything and everything with pure will',
        linkedAttributeId: 'wis',
        difficulty: 'Impossible',
        category: 'Divine',
      },
    ],
    attributes: mockAttributes,
  },
};

export const ManySkills: Story = {
  args: {
    skills: [
      {
        id: 'athletics',
        name: 'Athletics',
        description: 'Running, jumping, climbing',
        linkedAttributeId: 'str',
        difficulty: 'Easy',
        category: 'Physical',
      },
      {
        id: 'acrobatics',
        name: 'Acrobatics',
        description: 'Balance and agility',
        linkedAttributeId: 'dex',
        difficulty: 'Medium',
        category: 'Physical',
      },
      {
        id: 'investigation',
        name: 'Investigation',
        description: 'Finding clues and solving mysteries',
        linkedAttributeId: 'int',
        difficulty: 'Medium',
        category: 'Mental',
      },
      {
        id: 'insight',
        name: 'Insight',
        description: 'Reading people and situations',
        linkedAttributeId: 'wis',
        difficulty: 'Hard',
        category: 'Social',
      },
      {
        id: 'medicine',
        name: 'Medicine',
        description: 'Healing and medical knowledge',
        linkedAttributeId: 'wis',
        difficulty: 'Medium',
        category: 'Knowledge',
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Entertaining others',
        linkedAttributeId: 'str',
        difficulty: 'Easy',
        category: 'Social',
      },
      {
        id: 'persuasion',
        name: 'Persuasion',
        description: 'Convincing others',
        linkedAttributeId: 'str',
        difficulty: 'Medium',
        category: 'Social',
      },
      {
        id: 'sleight_of_hand',
        name: 'Sleight of Hand',
        description: 'Manual dexterity and tricks',
        linkedAttributeId: 'dex',
        difficulty: 'Hard',
        category: 'Utility',
      },
    ],
    attributes: mockAttributes,
  },
};