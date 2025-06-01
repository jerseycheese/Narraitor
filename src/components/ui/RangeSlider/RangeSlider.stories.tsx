import { Meta, StoryObj } from '@storybook/react';
import RangeSlider, { LevelDescription } from './RangeSlider';

const meta: Meta<typeof RangeSlider> = {
  title: 'Narraitor/UI/Controls/RangeSlider',
  component: RangeSlider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    onChange: { action: 'changed' },
    disabled: { control: 'boolean' },
    showLabel: { control: 'boolean' },
    labelText: { control: 'text' },
    showLevelDescription: { control: 'boolean' },
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
type Story = StoryObj<typeof RangeSlider>;

// Example level descriptions for skill levels
const skillLevelDescriptions: LevelDescription[] = [
  { value: 1, label: 'Novice', description: 'Beginner understanding with limited skill' },
  { value: 2, label: 'Apprentice', description: 'Basic proficiency with room for improvement' },
  { value: 3, label: 'Competent', description: 'Solid performance in most situations' },
  { value: 4, label: 'Expert', description: 'Advanced mastery with consistent results' },
  { value: 5, label: 'Master', description: 'Complete mastery at professional level' },
];

// Slider with skill level descriptions
export const WithLevelDescriptions: Story = {
  args: {
    value: 3,
    min: 1,
    max: 5,
    showLabel: true,
    showLevelDescription: true,
    levelDescriptions: skillLevelDescriptions,
    disabled: false,
  },
  name: 'With Level Descriptions',
};

// Custom value formatter
export const CustomValueFormatter: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
    showLabel: true,
    labelText: 'Percentage',
    valueFormatter: (value) => `${value}%`,
    disabled: false,
  },
  name: 'Custom Value Formatter',
};

// All levels example
export const AllLevels: Story = {
  render: (args) => {
    return (
      <div className="space-y-6">
        {skillLevelDescriptions.map((level) => (
          <div key={level.value}>
            <h3 className="text-sm font-medium mb-2">{level.label} (Level {level.value})</h3>
            <RangeSlider
              {...args}
              value={level.value}
              levelDescriptions={skillLevelDescriptions}
              showLevelDescription={true}
            />
          </div>
        ))}
      </div>
    );
  },
  args: {
    min: 1,
    max: 5,
    showLabel: true,
  },
  name: 'All Skill Levels',
};