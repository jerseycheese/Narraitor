import type { Meta, StoryObj } from '@storybook/react';
import { CharacterSkillDisplay } from '@/components/characters/CharacterSkillDisplay';

const meta: Meta<typeof CharacterSkillDisplay> = {
  title: '02-Molecules/character-display/CharacterSkillDisplay',
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
    category: 'combat',
    description: 'The art of wielding bladed weapons with precision and skill'
  },
  {
    id: 'skill-2',
    characterId: 'char-1',
    name: 'Stealth',
    level: 2,
    category: 'agility',
    description: 'Moving unseen and unheard through shadows and crowds'
  },
  {
    id: 'skill-3',
    characterId: 'char-1',
    name: 'Persuasion',
    level: 4,
    category: 'social',
    description: 'The ability to convince others through charm and reasoning'
  },
  {
    id: 'skill-4',
    characterId: 'char-1',
    name: 'Archery',
    level: 5,
    category: 'combat',
    description: 'Expert marksmanship with bow and arrow'
  },
  {
    id: 'skill-5',
    characterId: 'char-1',
    name: 'Lockpicking',
    level: 1,
    category: 'agility',
    description: 'Opening locks without the proper key using tools and finesse'
  },
  {
    id: 'skill-6',
    characterId: 'char-1',
    name: 'History',
    level: 3,
    category: 'knowledge',
    description: 'Knowledge of past events, cultures, and civilizations'
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
        category: 'combat',
        description: 'Legendary proficiency with bladed weapons, capable of defeating multiple opponents'
      },
      {
        id: 'skill-2',
        characterId: 'char-1',
        name: 'Novice Stealth',
        level: 1,
        category: 'agility',
        description: 'Basic ability to move quietly and avoid detection'
      },
      {
        id: 'skill-3',
        characterId: 'char-1',
        name: 'Expert Negotiation',
        level: 4,
        category: 'social',
        description: 'Advanced diplomatic skills for resolving conflicts and striking deals'
      }
    ],
    showCategories: false
  }
};
