import type { Meta, StoryObj } from '@storybook/react';
import SkillDifficulty from './SkillDifficulty';
import { 
  SKILL_DIFFICULTIES
} from '@/lib/constants/skillDifficultyLevels';

const meta: Meta<typeof SkillDifficulty> = {
  title: 'Narraitor/UI/Controls/SkillDifficulty',
  component: SkillDifficulty,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component to display skill difficulty levels with appropriate styling'
      }
    },
  },
  tags: ['autodocs'],
  argTypes: {
    difficulty: {
      control: { type: 'select' },
      options: ['easy', 'medium', 'hard'],
      description: 'The difficulty level of the skill',
    },
    showDescription: {
      control: 'boolean',
      description: 'Whether to display the description text',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    )
  ],
};

export default meta;
type Story = StoryObj<typeof SkillDifficulty>;

export const WithDescription: Story = {
  args: {
    difficulty: 'medium',
    showDescription: true,
  },
};

export const AllDifficulties: Story = {
  render: () => (
    <div className="space-y-6">
      {SKILL_DIFFICULTIES.map((difficulty) => (
        <div key={difficulty.value} className="flex flex-col">
          <h3 className="text-sm font-medium mb-2">{difficulty.label}</h3>
          <SkillDifficulty
            difficulty={difficulty.value}
            showDescription={true}
          />
        </div>
      ))}
    </div>
  ),
};


export const InContext: Story = {
  render: () => (
    <div className="border p-4 rounded shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Skill: Arcane Mastery</h3>
        <p className="text-sm text-gray-600 mb-2">The ability to manipulate magical energies</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Learning Curve:</span>
          <SkillDifficulty
            difficulty="hard"
            showDescription={false}
          />
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Skill: Animal Handling</h3>
        <p className="text-sm text-gray-600 mb-2">Calming and controlling animals</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Learning Curve:</span>
          <SkillDifficulty
            difficulty="medium"
            showDescription={false}
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Skill: Observation</h3>
        <p className="text-sm text-gray-600 mb-2">Noticing details in your surroundings</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Learning Curve:</span>
          <SkillDifficulty
            difficulty="easy"
            showDescription={false}
          />
        </div>
      </div>
    </div>
  ),
};