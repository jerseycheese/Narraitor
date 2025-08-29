import type { Meta, StoryObj } from '@storybook/react';
import { CharacterSkillDisplay } from './CharacterSkillDisplay';

const meta: Meta<typeof CharacterSkillDisplay> = {
  title: 'Narraitor/Character/Display/CharacterSkillDisplay',
  component: CharacterSkillDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays character skills with levels and optional category grouping for narrative RPG characters.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    showCategories: {
      control: 'boolean',
      description: 'Whether to group skills by category'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSkills = [
  {
    id: 'skill-1',
    characterId: 'char-1',
    name: 'Swordsmanship',
    level: 3,
    category: 'combat'
  },
  {
    id: 'skill-2',
    characterId: 'char-1',
    name: 'Stealth',
    level: 2,
    category: 'agility'
  },
  {
    id: 'skill-3',
    characterId: 'char-1',
    name: 'Persuasion',
    level: 4,
    category: 'social'
  },
  {
    id: 'skill-4',
    characterId: 'char-1',
    name: 'Archery',
    level: 5,
    category: 'combat'
  },
  {
    id: 'skill-5',
    characterId: 'char-1',
    name: 'Lockpicking',
    level: 1,
    category: 'agility'
  },
  {
    id: 'skill-6',
    characterId: 'char-1',
    name: 'History',
    level: 3,
    category: 'knowledge'
  }
];

export const Default: Story = {
  args: {
    skills: sampleSkills,
    showCategories: false
  }
};

export const WithCategories: Story = {
  args: {
    skills: sampleSkills,
    showCategories: true
  }
};

export const VariedLevels: Story = {
  args: {
    skills: [
      {
        id: 'skill-1',
        characterId: 'char-1',
        name: 'Master Swordsmanship',
        level: 5,
        category: 'combat'
      },
      {
        id: 'skill-2',
        characterId: 'char-1',
        name: 'Novice Stealth',
        level: 1,
        category: 'agility'
      },
      {
        id: 'skill-3',
        characterId: 'char-1',
        name: 'Expert Negotiation',
        level: 4,
        category: 'social'
      }
    ],
    showCategories: false
  }
};
