import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SkillsStep } from '@/components/CharacterCreationWizard/steps/SkillsStep';
import type { World } from '@/types/world.types';

const worldConfig: World = {
  id: 'world-1',
  name: 'Storybook World',
  description: 'A lightweight world used to preview the SkillsStep.',
  genre: 'fantasy',
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Raw physical power.',
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
      category: 'physical',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Swordsmanship',
      description: 'Maintaining form while wielding a blade.',
      difficulty: 'medium',
      category: 'combat',
      attributeIds: ['attr-1'],
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
    },
    {
      id: 'skill-2',
      worldId: 'world-1',
      name: 'Tactics',
      description: 'Plan ahead and outmaneuver opponents.',
      difficulty: 'hard',
      category: 'mental',
      attributeIds: ['attr-1'],
      baseValue: 1,
      minValue: 1,
      maxValue: 4,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 20,
    skillPointPool: 6,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const meta = {
  title: '04-Templates/wizards/character/SkillsStep',
  component: SkillsStep,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SkillsStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      characterData: {
        skills: [
          {
            skillId: 'skill-1',
            name: 'Swordsmanship',
            description: 'Maintaining form while wielding a blade.',
            attributeIds: ['attr-1'],
            level: 3,
            minLevel: 1,
            maxLevel: 5,
            isSelected: true,
          },
          {
            skillId: 'skill-2',
            name: 'Tactics',
            description: 'Plan ahead and outmaneuver opponents.',
            attributeIds: ['attr-1'],
            level: 1,
            minLevel: 1,
            maxLevel: 4,
            isSelected: false,
          },
        ],
      },
      pointPools: {
        skills: {
          total: worldConfig.settings.skillPointPool,
          spent: 2,
          remaining: 4,
        },
      },
      validation: {},
    },
    onUpdate: action('onUpdate'),
    onValidation: action('onValidation'),
    worldConfig,
  },
  render: (args) => (
    <div className="max-w-3xl">
      <SkillsStep {...args} />
    </div>
  ),
};
