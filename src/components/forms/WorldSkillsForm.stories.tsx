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
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'skill-2',
    worldId: 'world-123',
    name: 'Research',
    description: 'Finding and analyzing information',
    attributeIds: ['attr-2'],
    difficulty: 'easy' as const,
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
];

const meta: Meta<typeof WorldSkillsForm> = {
  title: 'Narraitor/World/Forms/WorldSkillsForm',
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

