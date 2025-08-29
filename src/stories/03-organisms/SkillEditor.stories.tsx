import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SkillEditor } from './SkillEditor';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
// SkillDifficulty type used in WorldSkill interface

const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    name: 'Strength',
    description: 'Physical power and muscle',
    worldId: 'world-1',
    baseValue: 8,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-2',
    name: 'Intelligence',
    description: 'Mental capacity and reasoning',
    worldId: 'world-1',
    baseValue: 7,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-3',
    name: 'Dexterity',
    description: 'Agility and hand-eye coordination',
    worldId: 'world-1',
    baseValue: 6,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-4',
    name: 'Charisma',
    description: 'Social skills and leadership',
    worldId: 'world-1',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
];

const mockSkills: WorldSkill[] = [
  {
    id: 'skill-1',
    name: 'Swordsmanship',
    description: 'Combat with bladed weapons',
    worldId: 'world-1',
    attributeIds: ['attr-1', 'attr-3'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'skill-2',
    name: 'Diplomacy',
    description: 'Negotiation and persuasion',
    worldId: 'world-1',
    attributeIds: ['attr-2', 'attr-4'],
    difficulty: 'hard',
    baseValue: 4,
    minValue: 1,
    maxValue: 10,
  },
];

const meta: Meta<typeof SkillEditor> = {
  title: 'Narraitor/World/SkillEditor',
  component: SkillEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for creating and editing skills with multi-attribute linking capabilities.',
      },
    },
  },
  args: {
    worldId: 'world-1',
    existingAttributes: mockAttributes,
    existingSkills: mockSkills,
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    onDelete: action('onDelete'),
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['create', 'edit'],
    },
    maxSkills: {
      control: 'number',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkillEditor>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    skillId: 'skill-1',
  },
};


export const EditComplexSkill: Story = {
  args: {
    mode: 'edit',
    skillId: 'skill-complex',
    existingSkills: [
      ...mockSkills,
      {
        id: 'skill-complex',
        name: 'Battle Tactics',
        description: 'Advanced military strategy and battlefield coordination',
        worldId: 'world-1',
        attributeIds: ['attr-2', 'attr-4'],
        difficulty: 'hard',
        baseValue: 3,
        minValue: 1,
        maxValue: 10,
      },
    ],
  },
};

