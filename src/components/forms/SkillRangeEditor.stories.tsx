import { Meta, StoryObj } from '@storybook/react';
import SkillRangeEditor from './SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';
import { SKILL_MIN_VALUE, SKILL_MAX_VALUE } from '@/lib/constants/skillLevelDescriptions';

const meta: Meta<typeof SkillRangeEditor> = {
  title: 'Narraitor/Forms/SkillRangeEditor',
  component: SkillRangeEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'changed' },
  },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SkillRangeEditor>;

const defaultSkill: WorldSkill = {
  id: 'skill-1',
  worldId: 'world-1',
  name: 'Acrobatics',
  description: 'Ability to perform gymnastic feats and maintain balance',
  difficulty: 'medium',
  category: 'Physical',
  linkedAttributeId: 'attr-1',
  baseValue: 3,
  minValue: SKILL_MIN_VALUE,
  maxValue: SKILL_MAX_VALUE,
};

export const Default: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    disabled: false,
  },
};

export const WithLevelDescriptions: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    showLevelDescriptions: true,
    disabled: false,
  },
};

export const LowValue: Story = {
  args: {
    skill: {
      ...defaultSkill,
      baseValue: 1,
    },
    showLabels: true,
    showLevelDescriptions: true,
    disabled: false,
  },
  name: 'Novice Level (1)',
};

export const MidValue: Story = {
  args: {
    skill: {
      ...defaultSkill,
      baseValue: 3,
    },
    showLabels: true,
    showLevelDescriptions: true,
    disabled: false,
  },
  name: 'Competent Level (3)',
};

export const HighValue: Story = {
  args: {
    skill: {
      ...defaultSkill,
      baseValue: 5,
    },
    showLabels: true,
    showLevelDescriptions: true,
    disabled: false,
  },
  name: 'Master Level (5)',
};

export const Disabled: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    disabled: true,
  },
};

export const NoLabels: Story = {
  args: {
    skill: defaultSkill,
    showLabels: false,
    disabled: false,
  },
};

export const Compact: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    compact: true,
    disabled: false,
  },
};

export const CompactWithLevelDescriptions: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    showLevelDescriptions: true,
    compact: true,
    disabled: false,
  },
};

// Legacy range example - will be clamped to 1-5 range
export const LegacyRange: Story = {
  args: {
    skill: {
      ...defaultSkill,
      minValue: 0,
      maxValue: 10,
      baseValue: 7,
    },
    showLabels: true,
    disabled: false,
  },
  name: 'Legacy Range (Will be clamped to standard range)',
};