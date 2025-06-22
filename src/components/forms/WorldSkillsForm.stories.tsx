import type { Meta, StoryObj } from '@storybook/react';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { DEFAULT_SKILL_DIFFICULTY } from '@/lib/constants/skillDifficultyLevels';

const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    worldId: 'world-123',
    name: 'Strength',
    description: 'Physical power',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
  },
  {
    id: 'attr-2',
    worldId: 'world-123',
    name: 'Intelligence',
    description: 'Mental acuity',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
  },
];

const mockSkills: WorldSkill[] = [
  {
    id: 'skill-1',
    worldId: 'world-123',
    name: 'Athletics',
    description: 'Physical prowess and sports',
    attributeIds: ['attr-1'],
    difficulty: DEFAULT_SKILL_DIFFICULTY,
    category: 'Physical',
    baseValue: 3,
    minValue: 1,
    maxValue: 5,
  },
  {
    id: 'skill-2',
    worldId: 'world-123',
    name: 'Research',
    description: 'Finding and analyzing information',
    attributeIds: ['attr-2'],
    difficulty: 'easy' as const,
    category: 'Mental',
    baseValue: 4,
    minValue: 1,
    maxValue: 5,
  },
];

const meta: Meta<typeof WorldSkillsForm> = {
  title: 'Narraitor/World/Forms/WorldSkillsForm',
  component: WorldSkillsForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete skill editor form with difficulty selection, value ranges, category fields, and multi-attribute linking. All features from Issue #524 are fully implemented.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldSkillsForm>;

export const Default: Story = {
  args: {
    skills: mockSkills,
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const Empty: Story = {
  args: {
    skills: [],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const AllDifficulties: Story = {
  name: 'All Difficulty Levels',
  args: {
    skills: [
      {
        id: 'skill-easy',
        worldId: 'world-123',
        name: 'Basic Cooking',
        description: 'Simple meal preparation',
        attributeIds: ['attr-1'],
        difficulty: 'easy' as const,
        category: 'Survival',
        baseValue: 2,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-medium',
        worldId: 'world-123',
        name: 'Swordsmanship',
        description: 'Combat with bladed weapons',
        attributeIds: ['attr-1'],
        difficulty: 'medium' as const,
        category: 'Combat',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-hard',
        worldId: 'world-123',
        name: 'Arcane Magic',
        description: 'Advanced spellcasting and magical theory',
        attributeIds: ['attr-2'],
        difficulty: 'hard' as const,
        category: 'Magic',
        baseValue: 1,
        minValue: 1,
        maxValue: 5,
      },
    ],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const MultiAttributeLinking: Story = {
  name: 'Multi-Attribute Skills',
  args: {
    skills: [
      {
        id: 'skill-multi',
        worldId: 'world-123',
        name: 'Leadership',
        description: 'Inspiring and commanding others in various situations',
        attributeIds: ['attr-1', 'attr-2'], // Links to both Strength and Intelligence
        difficulty: 'hard' as const,
        category: 'Social',
        baseValue: 2,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-single',
        worldId: 'world-123',
        name: 'Lockpicking',
        description: 'Opening locks without keys',
        attributeIds: ['attr-2'], // Only Intelligence
        difficulty: 'medium' as const,
        category: 'Stealth',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-none',
        worldId: 'world-123',
        name: 'Meditation',
        description: 'Mental discipline and focus',
        attributeIds: [], // No attributes linked
        difficulty: 'easy' as const,
        category: 'Spiritual',
        baseValue: 4,
        minValue: 1,
        maxValue: 5,
      },
    ],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const VariousCategories: Story = {
  name: 'Skills with Categories',
  args: {
    skills: [
      {
        id: 'skill-combat',
        worldId: 'world-123',
        name: 'Archery',
        description: 'Precision shooting with bow and arrow',
        attributeIds: ['attr-1'],
        difficulty: 'medium' as const,
        category: 'Combat',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-magic',
        worldId: 'world-123',
        name: 'Healing Magic',
        description: 'Restoration and curative spells',
        attributeIds: ['attr-2'],
        difficulty: 'hard' as const,
        category: 'Magic',
        baseValue: 2,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-social',
        worldId: 'world-123',
        name: 'Persuasion',
        description: 'Convincing others through speech',
        attributeIds: ['attr-2'],
        difficulty: 'medium' as const,
        category: 'Social',
        baseValue: 4,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'skill-uncategorized',
        worldId: 'world-123',
        name: 'Wilderness Survival',
        description: 'Living off the land',
        attributeIds: ['attr-1'],
        difficulty: 'easy' as const,
        category: '', // No category
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
    ],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const NoAttributes: Story = {
  name: 'No Attributes Available',
  args: {
    skills: mockSkills,
    attributes: [],
    worldId: 'world-123',
  },
};

