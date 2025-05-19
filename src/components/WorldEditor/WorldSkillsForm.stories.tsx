import type { Meta, StoryObj } from '@storybook/react';
import WorldSkillsForm from './WorldSkillsForm';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

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
    linkedAttributeId: 'attr-1',
    difficulty: 'medium',
    category: 'Physical',
  },
  {
    id: 'skill-2',
    worldId: 'world-123',
    name: 'Research',
    description: 'Finding and analyzing information',
    linkedAttributeId: 'attr-2',
    difficulty: 'easy',
    category: 'Mental',
  },
];

const meta: Meta<typeof WorldSkillsForm> = {
  title: 'Narraitor/World/Editor/WorldSkillsForm',
  component: WorldSkillsForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for managing world skills with attribute linking and difficulty settings',
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

export const NoAttributes: Story = {
  args: {
    skills: mockSkills,
    attributes: [],
    worldId: 'world-123',
  },
};

export const SingleSkill: Story = {
  args: {
    skills: [mockSkills[0]],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const AllDifficulties: Story = {
  args: {
    skills: [
      { ...mockSkills[0], difficulty: 'easy' },
      { ...mockSkills[1], difficulty: 'medium' },
      {
        id: 'skill-3',
        worldId: 'world-123',
        name: 'Advanced Magic',
        description: 'Complex spell casting',
        difficulty: 'hard',
      },
    ],
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};

export const UnlinkedSkills: Story = {
  args: {
    skills: mockSkills.map(skill => ({
      ...skill,
      linkedAttributeId: undefined,
    })),
    attributes: mockAttributes,
    worldId: 'world-123',
  },
};