import type { Meta, StoryObj } from '@storybook/react';
import SkillRequirementBadge from './SkillRequirementBadge';
import { DecisionRequirement } from '@/types/narrative.types';

const meta: Meta<typeof SkillRequirementBadge> = {
  title: 'UI/SkillRequirementBadge',
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

export const HighRequirement: Story = {
  args: {
    requirement: {
      type: 'skill',
      targetId: 'arcane-mastery',
      operator: 'gte',
      value: 15
    },
    skillName: 'Arcane Mastery',
    isAvailable: false,
  },
};

export const MultipleBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SkillRequirementBadge
        requirement={{ type: 'skill', targetId: 'strength', operator: 'gte', value: 8 }}
        skillName="Strength"
        isAvailable={true}
      />
      <SkillRequirementBadge
        requirement={{ type: 'skill', targetId: 'stealth', operator: 'gte', value: 5 }}
        skillName="Stealth"
        isAvailable={false}
      />
      <SkillRequirementBadge
        requirement={{ type: 'skill', targetId: 'magic', operator: 'gte', value: 12 }}
        skillName="Magic"
        isAvailable={true}
      />
    </div>
  ),
};