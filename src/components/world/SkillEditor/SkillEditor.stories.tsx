import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SkillEditor } from './SkillEditor';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
// SkillDifficulty type used in WorldSkill interface

const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    name: 'Strength',
    description: 'Physical power and muscle',
    worldId: 'world-1',
    baseValue: 8,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-2',
    name: 'Intelligence',
    description: 'Mental capacity and reasoning',
    worldId: 'world-1',
    baseValue: 7,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-3',
    name: 'Dexterity',
    description: 'Agility and hand-eye coordination',
    worldId: 'world-1',
    baseValue: 6,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-4',
    name: 'Charisma',
    description: 'Social skills and leadership',
    worldId: 'world-1',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
];

const mockSkills: WorldSkill[] = [
  {
    id: 'skill-1',
    name: 'Swordsmanship',
    description: 'Combat with bladed weapons',
    worldId: 'world-1',
    attributeIds: ['attr-1', 'attr-3'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'skill-2',
    name: 'Diplomacy',
    description: 'Negotiation and persuasion',
    worldId: 'world-1',
    attributeIds: ['attr-2', 'attr-4'],
    difficulty: 'hard',
    baseValue: 4,
    minValue: 1,
    maxValue: 10,
  },
];

const meta: Meta<typeof SkillEditor> = {
  title: 'Narraitor/World/SkillEditor',
  component: SkillEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for creating and editing skills with multi-attribute linking capabilities.',
      },
    },
  },
  args: {
    worldId: 'world-1',
    existingAttributes: mockAttributes,
    existingSkills: mockSkills,
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    onDelete: action('onDelete'),
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['create', 'edit'],
    },
    maxSkills: {
      control: 'number',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkillEditor>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
};

export const CreateModeWithMaxSkills: Story = {
  args: {
    mode: 'create',
    maxSkills: 12,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor in create mode with a maximum skill limit enforced.',
      },
    },
  },
};

export const CreateModeAtMaxLimit: Story = {
  args: {
    mode: 'create',
    maxSkills: 2, // Same as number of existing skills
    existingSkills: mockSkills,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor when the maximum number of skills has been reached.',
      },
    },
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    skillId: 'skill-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor in edit mode with existing skill data loaded.',
      },
    },
  },
};

export const EditModeWithDeleteHandler: Story = {
  args: {
    mode: 'edit',
    skillId: 'skill-1',
    onDelete: action('onDelete'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor in edit mode with delete functionality enabled.',
      },
    },
  },
};

export const NoAttributes: Story = {
  args: {
    mode: 'create',
    existingAttributes: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor when no attributes are available for linking.',
      },
    },
  },
};

export const SingleAttribute: Story = {
  args: {
    mode: 'create',
    existingAttributes: [mockAttributes[0]],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor with only one attribute available for linking.',
      },
    },
  },
};

export const ManyAttributes: Story = {
  args: {
    mode: 'create',
    existingAttributes: [
      ...mockAttributes,
      {
        id: 'attr-5',
        name: 'Constitution',
        description: 'Physical endurance and health',
        worldId: 'world-1',
        baseValue: 6,
        minValue: 1,
        maxValue: 10,
      },
      {
        id: 'attr-6',
        name: 'Wisdom',
        description: 'Intuition and insight',
        worldId: 'world-1',
        baseValue: 7,
        minValue: 1,
        maxValue: 10,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill editor with many attributes available for testing scrolling and selection.',
      },
    },
  },
};

export const EditComplexSkill: Story = {
  args: {
    mode: 'edit',
    skillId: 'skill-complex',
    existingSkills: [
      ...mockSkills,
      {
        id: 'skill-complex',
        name: 'Battle Tactics',
        description: 'Advanced military strategy and battlefield coordination requiring multiple mental and social skills',
        worldId: 'world-1',
        attributeIds: ['attr-2', 'attr-4'], // Intelligence + Charisma
        difficulty: 'hard',
        baseValue: 3,
        minValue: 1,
        maxValue: 10,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows editing a complex skill with multiple attributes and a long description.',
      },
    },
  },
};

export const ValidationExample: Story = {
  args: {
    mode: 'create',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use this story to test validation by submitting empty forms or duplicate names.',
      },
    },
  },
  play: async () => {
    // This story is primarily for manual validation testing
    // Users can interact with it to see validation errors
  },
};