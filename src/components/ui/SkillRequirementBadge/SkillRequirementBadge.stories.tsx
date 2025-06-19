import type { Meta, StoryObj } from '@storybook/react';
import SkillRequirementBadge from './SkillRequirementBadge';
import { DecisionRequirement } from '@/types/narrative.types';

const meta: Meta<typeof SkillRequirementBadge> = {
  title: 'Narraitor/UI/SkillRequirementBadge',
  component: SkillRequirementBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isAvailable: { control: 'boolean' },
    skillName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseRequirement: DecisionRequirement = {
  type: 'skill',
  targetId: 'intimidation',
  operator: 'gte',
  value: 6
};

export const Available: Story = {
  args: {
    requirement: baseRequirement,
    skillName: 'Intimidation',
    isAvailable: true,
  },
};

export const Unavailable: Story = {
  args: {
    requirement: baseRequirement,
    skillName: 'Intimidation',
    isAvailable: false,
  },
};

export const UnknownSkill: Story = {
  args: {
    requirement: baseRequirement,
    skillName: undefined,
    isAvailable: false,
  },
};

