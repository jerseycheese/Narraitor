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
  {
    id: 'cha',
    worldId: 'world-1',
    name: 'Charisma',
    description: 'Force of personality and leadership',
    minValue: 1,
    maxValue: 20,
    baseValue: 10,
    category: 'Social',
  },
  {
    id: 'con',
    worldId: 'world-1',
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
        worldId: 'world-minimal',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
      },
      {
        id: 'int',
        worldId: 'world-minimal',
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
        worldId: 'world-no-categories',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
      },
      {
        id: 'dex',
        worldId: 'world-no-categories',
        name: 'Dexterity',
        description: 'Agility and coordination',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
      },
      {
        id: 'int',
        worldId: 'world-no-categories',
        name: 'Intelligence',
        description: 'Mental acuity',
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
        worldId: 'world-varied',
        name: 'Power Level',
        description: 'Overall character power',
        minValue: 1,
        maxValue: 100,
        baseValue: 25,
        category: 'Special',
      },
      {
        id: 'skill',
        worldId: 'world-varied',
        name: 'Skill Rating',
        description: 'General competency',
        minValue: 0,
        maxValue: 5,
        baseValue: 2,
        category: 'General',
      },
      {
        id: 'luck',
        worldId: 'world-varied',
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
        worldId: 'world-fantasy',
        name: 'Strength',
        description: 'Raw physical power and muscle',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'dex',
        worldId: 'world-fantasy',
        name: 'Dexterity',
        description: 'Agility, reflexes, and hand-eye coordination',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'con',
        worldId: 'world-fantasy',
        name: 'Constitution',
        description: 'Health, stamina, and vitality',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'int',
        worldId: 'world-fantasy',
        name: 'Intelligence',
        description: 'Reasoning ability, memory, and analytical skill',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'wis',
        worldId: 'world-fantasy',
        name: 'Wisdom',
        description: 'Awareness, intuition, and insight',
        minValue: 3,
        maxValue: 18,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'cha',
        worldId: 'world-fantasy',
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
        worldId: 'world-scifi',
        name: 'Body',
        description: 'Physical conditioning and augmentations',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Physical',
      },
      {
        id: 'mind',
        worldId: 'world-scifi',
        name: 'Mind',
        description: 'Neural processing and cybernetic interfaces',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Mental',
      },
      {
        id: 'tech',
        worldId: 'world-scifi',
        name: 'Tech',
        description: 'Technology integration and hacking ability',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Technical',
      },
      {
        id: 'edge',
        worldId: 'world-scifi',
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
        worldId: 'world-single',
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
        worldId: 'world-many',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'dex',
        worldId: 'world-many',
        name: 'Dexterity',
        description: 'Agility and reflexes',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'con',
        worldId: 'world-many',
        name: 'Constitution',
        description: 'Health and endurance',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Physical',
      },
      {
        id: 'int',
        worldId: 'world-many',
        name: 'Intelligence',
        description: 'Reasoning and memory',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'wis',
        worldId: 'world-many',
        name: 'Wisdom',
        description: 'Awareness and insight',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Mental',
      },
      {
        id: 'cha',
        worldId: 'world-many',
        name: 'Charisma',
        description: 'Force of personality',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Social',
      },
      {
        id: 'luck',
        worldId: 'world-many',
        name: 'Luck',
        description: 'Random chance',
        minValue: 1,
        maxValue: 20,
        baseValue: 10,
        category: 'Mystical',
      },
      {
        id: 'honor',
        worldId: 'world-many',
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
