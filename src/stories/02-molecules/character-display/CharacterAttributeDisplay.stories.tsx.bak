import type { Meta, StoryObj } from '@storybook/react';
import { CharacterAttributeDisplay } from '@/components/characters/CharacterAttributeDisplay';

const meta: Meta<typeof CharacterAttributeDisplay> = {
  title: '02-Molecules/character-display/CharacterAttributeDisplay',
  component: CharacterAttributeDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays character attributes with optional category grouping for narrative RPG characters.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    showCategories: {
      control: 'boolean',
      description: 'Whether to group attributes by category'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleAttributes = [
  {
    id: 'attr-1',
    characterId: 'char-1',
    name: 'Strength',
    baseValue: 8,
    modifiedValue: 8,
    category: 'physical',
    description: 'Physical power and muscle strength for combat and lifting'
  },
  {
    id: 'attr-2',
    characterId: 'char-1',
    name: 'Intelligence',
    baseValue: 6,
    modifiedValue: 7,
    category: 'mental',
    description: 'Reasoning ability, memory, and learning capacity'
  },
  {
    id: 'attr-3',
    characterId: 'char-1',
    name: 'Charisma',
    baseValue: 7,
    modifiedValue: 7,
    category: 'social',
    description: 'Force of personality, persuasiveness, and leadership ability'
  },
  {
    id: 'attr-4',
    characterId: 'char-1',
    name: 'Agility',
    baseValue: 9,
    modifiedValue: 9,
    category: 'physical',
    description: 'Speed, reflexes, and nimbleness in movement'
  },
  {
    id: 'attr-5',
    characterId: 'char-1',
    name: 'Wisdom',
    baseValue: 5,
    modifiedValue: 5,
    category: 'mental',
    description: 'Insight, willpower, and understanding of the world'
  }
];

export const Default: Story = {
  args: {
    attributes: sampleAttributes,
    showCategories: false
  }
};

export const WithCategories: Story = {
  args: {
    attributes: sampleAttributes,
    showCategories: true
  }
};

export const ModifiedValues: Story = {
  args: {
    attributes: [
      {
        id: 'attr-1',
        characterId: 'char-1',
        name: 'Strength',
        baseValue: 6,
        modifiedValue: 8,
        category: 'physical',
        description: 'Physical power enhanced by magical equipment or temporary buffs'
      },
      {
        id: 'attr-2',
        characterId: 'char-1',
        name: 'Intelligence',
        baseValue: 7,
        modifiedValue: 5,
        category: 'mental',
        description: 'Reasoning ability, currently impaired by curse or debuff'
      }
    ],
    showCategories: false
  }
};
