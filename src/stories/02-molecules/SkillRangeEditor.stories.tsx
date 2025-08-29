import { Meta, StoryObj } from '@storybook/react';
import SkillRangeEditor from './SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';
import { MIN_SKILL_VALUE as SKILL_MIN_VALUE, MAX_SKILL_VALUE as SKILL_MAX_VALUE } from '@/lib/constants/skillLevelDescriptions';

const meta: Meta<typeof SkillRangeEditor> = {
  title: 'Narraitor/UI/Forms/SkillRangeEditor',
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
  attributeIds: ['attr-1'],
  baseValue: 3,
  minValue: SKILL_MIN_VALUE,
  maxValue: SKILL_MAX_VALUE,
};

export const Default: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    showLevelDescriptions: true,
    disabled: false,
  },
};

export const SkillLevels: Story = {
  render: (args) => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Novice (Level 1)</h3>
          <SkillRangeEditor
            skill={{...defaultSkill, baseValue: 1}}
            onChange={args.onChange}
            showLevelDescriptions={true}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Competent (Level 3)</h3>
          <SkillRangeEditor
            skill={{...defaultSkill, baseValue: 3}}
            onChange={args.onChange}
            showLevelDescriptions={true}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Master (Level 5)</h3>
          <SkillRangeEditor
            skill={{...defaultSkill, baseValue: 5}}
            onChange={args.onChange}
            showLevelDescriptions={true}
          />
        </div>
      </div>
    );
  },
  name: 'All Skill Levels',
};

export const Disabled: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    disabled: true,
  },
};
