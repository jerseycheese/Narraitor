import type { Meta, StoryObj } from '@storybook/react';
import { WorldAttributesList } from './WorldAttributesList';
import { WorldAttribute } from '@/types/world.types';

const meta = {
  title: 'Narraitor/World/Display/WorldAttributesList',
  component: WorldAttributesList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldAttributesList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockAttributes: WorldAttribute[] = [
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
  {
    id: 'cha',
    name: 'Charisma',
    description: 'Force of personality and leadership',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Social',
  },
  {
    id: 'con',
    name: 'Constitution',
    description: 'Health and endurance',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Physical',
  },
];

export const Default: Story = {
  args: {
    attributes: mockAttributes,
  },
};

export const MinimalAttributes: Story = {
  args: {
    attributes: [
      {
        id: 'str',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
      {
        id: 'int',
        name: 'Intelligence',
        description: 'Mental acuity',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
    ],
  },
};

export const WithoutDescriptions: Story = {
  args: {
    attributes: [
      {
        id: 'str',
        name: 'Strength',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
      },
      {
        id: 'dex',
        name: 'Dexterity',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
      },
      {
        id: 'int',
        name: 'Intelligence',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
      },
    ],
  },
};

export const VariedRanges: Story = {
  args: {
    attributes: [
      {
        id: 'power',
        name: 'Power Level',
        description: 'Overall character power',
        minValue: 1,
        maxValue: 100,
        baseValue: 25,
        category: 'Special',
      },
      {
        id: 'skill',
        name: 'Skill Rating',
        description: 'General competency',
        minValue: 0,
        maxValue: 5,
        baseValue: 2,
        category: 'General',
      },
      {
        id: 'luck',
        name: 'Luck',
        description: 'Random chance modifier',
        minValue: -10,
        maxValue: 10,
        baseValue: 0,
        category: 'Mystical',
      },
    ],
  },
};

export const Fantasy: Story = {
  args: {
    attributes: [
      {
        id: 'str',
        name: 'Strength',
        description: 'Raw physical power and muscle',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'dex',
        name: 'Dexterity',
        description: 'Agility, reflexes, and hand-eye coordination',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'con',
        name: 'Constitution',
        description: 'Health, stamina, and vitality',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'int',
        name: 'Intelligence',
        description: 'Reasoning ability, memory, and analytical skill',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'wis',
        name: 'Wisdom',
        description: 'Awareness, intuition, and insight',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'cha',
        name: 'Charisma',
        description: 'Force of personality, persuasiveness, and leadership',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Social',
      },
    ],
  },
};

export const SciFi: Story = {
  args: {
    attributes: [
      {
        id: 'body',
        name: 'Body',
        description: 'Physical conditioning and augmentations',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Physical',
      },
      {
        id: 'mind',
        name: 'Mind',
        description: 'Neural processing and cybernetic interfaces',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Mental',
      },
      {
        id: 'tech',
        name: 'Tech',
        description: 'Technology integration and hacking ability',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Technical',
      },
      {
        id: 'edge',
        name: 'Edge',
        description: 'Street credibility and network connections',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Social',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    attributes: [],
  },
};

export const SingleAttribute: Story = {
  args: {
    attributes: [
      {
        id: 'power',
        name: 'Power Level',
        description: 'The character\'s overall power and capability in this universe',
        minValue: 1,
        maxValue: 9000,
        baseValue: 100,
        category: 'Universal',
      },
    ],
  },
};

export const ManyAttributes: Story = {
  args: {
    attributes: [
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
        description: 'Agility and reflexes',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'con',
        name: 'Constitution',
        description: 'Health and endurance',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'int',
        name: 'Intelligence',
        description: 'Reasoning and memory',
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
      {
        id: 'cha',
        name: 'Charisma',
        description: 'Force of personality',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Social',
      },
      {
        id: 'luck',
        name: 'Luck',
        description: 'Random chance',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Mystical',
      },
      {
        id: 'honor',
        name: 'Honor',
        description: 'Moral standing',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Social',
      },
    ],
  },
};