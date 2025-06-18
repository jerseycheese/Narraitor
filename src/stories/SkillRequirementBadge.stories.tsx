import type { Meta, StoryObj } from '@storybook/react';
import SkillRequirementBadge from '@/components/ui/SkillRequirementBadge';
import type { DecisionRequirement } from '@/types/narrative.types';

const meta: Meta<typeof SkillRequirementBadge> = {
  title: 'UI/SkillRequirementBadge',
  component: SkillRequirementBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A specialized badge component for displaying skill requirements on narrative choices.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    skillName: {
      control: { type: 'text' },
      description: 'The name of the skill'
    },
    isAvailable: {
      control: { type: 'boolean' },
      description: 'Whether the player meets the requirement'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const gteRequirement: DecisionRequirement = {
  type: 'skill',
  targetId: 'intimidation',
  operator: 'gte',
  value: 6
};

const gtRequirement: DecisionRequirement = {
  type: 'skill',
  targetId: 'stealth',
  operator: 'gt',
  value: 7
};

export const IntimidationAvailable: Story = {
  args: {
    requirement: gteRequirement,
    skillName: 'Intimidation',
    isAvailable: true
  }
};

export const IntimidationUnavailable: Story = {
  args: {
    requirement: gteRequirement,
    skillName: 'Intimidation',
    isAvailable: false
  }
};

export const StealthAvailable: Story = {
  args: {
    requirement: gtRequirement,
    skillName: 'Stealth',
    isAvailable: true
  }
};

export const StealthUnavailable: Story = {
  args: {
    requirement: gtRequirement,
    skillName: 'Stealth',
    isAvailable: false
  }
};

export const UnknownSkill: Story = {
  args: {
    requirement: gteRequirement,
    skillName: undefined,
    isAvailable: false
  }
};

export const LongSkillName: Story = {
  args: {
    requirement: gteRequirement,
    skillName: 'Ancient Arcane Knowledge',
    isAvailable: true
  }
};