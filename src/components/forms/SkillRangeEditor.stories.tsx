import { Meta, StoryObj } from '@storybook/react';
import SkillRangeEditor from './SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';

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
  baseValue: 5,
  minValue: 1,
  maxValue: 10,
};

export const Default: Story = {
  args: {
    skill: defaultSkill,
    showLabels: true,
    disabled: false,
  },
};

export const LowValue: Story = {
  args: {
    skill: {
      ...defaultSkill,
      baseValue: 2,
    },
    showLabels: true,
    disabled: false,
  },
};

export const HighValue: Story = {
  args: {
    skill: {
      ...defaultSkill,
      baseValue: 9,
    },
    showLabels: true,
    disabled: false,
  },
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

export const CustomRange: Story = {
  args: {
    skill: {
      ...defaultSkill,
      minValue: 0,
      maxValue: 20,
      baseValue: 10,
    },
    showLabels: true,
    disabled: false,
  },
};