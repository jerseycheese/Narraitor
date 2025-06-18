import type { Meta, StoryObj } from '@storybook/react';
import ChoiceSelector from './ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import { Character } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';

const meta: Meta<typeof ChoiceSelector> = {
  title: 'Narraitor/Shared/ChoiceSelector',
  component: ChoiceSelector,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSelect: { action: 'choice selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;


// Decision with hints
const decisionWithHints: Decision = {
  id: 'decision-1',
  prompt: 'You encounter a locked door. How do you proceed?',
  options: [
    {
      id: 'opt-1',
      text: 'Pick the lock',
      hint: 'Requires Lockpicking skill',
    },
    {
      id: 'opt-2',
      text: 'Force the door open',
      hint: 'Requires high Strength',
    },
    {
      id: 'opt-3',
      text: 'Look for another way',
      hint: 'Safe but time-consuming',
    },
  ],
};

export const BasicChoices: Story = {
  args: {
    decision: decisionWithHints,
  },
};

export const WithCustomInput: Story = {
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the custom input field displayed above the choice options by default when enabled.',
      },
    },
  },
};

// === ALIGNMENT STORIES ===
// Mock aligned decision for alignment testing
const createAlignedDecision = (): Decision => ({
  id: 'mock-decision-aligned',
  prompt: 'You encounter a group of bandits blocking the road ahead. What will you do?',
  options: [
    {
      id: 'option-lawful',
      text: 'Approach peacefully and try to negotiate passage',
      alignment: 'lawful',
      hint: 'Respects authority and seeks peaceful resolution'
    },
    {
      id: 'option-neutral-1', 
      text: 'Assess the situation and look for alternative routes',
      alignment: 'neutral',
      hint: 'Practical approach to the problem'
    },
    {
      id: 'option-neutral-2',
      text: 'Wait and observe their behavior before acting',
      alignment: 'neutral',
      hint: 'Balanced and cautious response'
    },
    {
      id: 'option-chaotic',
      text: 'Start loudly singing an epic ballad about bandit fashion choices',
      alignment: 'chaotic',
      hint: 'Wildly unexpected action that completely changes the situation'
    }
  ]
});

export const AlignedChoices: Story = {
  args: {
    decision: createAlignedDecision(),
    showHints: true,
  },
};

export const AlignedChoicesWithCustomInput: Story = {
  args: {
    decision: createAlignedDecision(),
    enableCustomInput: true,
    showHints: true,
    onCustomSubmit: (text: string) => console.log('Custom submission:', text),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows aligned choices with custom input field displayed above for immediate use.',
      },
    },
  },
};

// Mock character and world data for skill requirements
const mockCharacter: Character = {
  id: 'char1',
  name: 'Brave Adventurer',
  description: 'A skilled adventurer',
  worldId: 'world1',
  attributes: [],
  skills: [
    { skillId: 'intimidation', level: 8, experience: 200, isActive: true },
    { skillId: 'stealth', level: 4, experience: 80, isActive: true },
    { skillId: 'lockpicking', level: 6, experience: 120, isActive: true },
  ],
  background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
  inventory: { characterId: 'char1', items: [], capacity: 20, categories: [] },
  status: { health: 100, maxHealth: 100, conditions: [] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockWorldSkills: WorldSkill[] = [
  { 
    id: 'intimidation', 
    name: 'Intimidation', 
    description: 'Force your will through fear', 
    worldId: 'world1', 
    difficulty: 'medium', 
    baseValue: 1, 
    minValue: 1, 
    maxValue: 10
  },
  { 
    id: 'stealth', 
    name: 'Stealth', 
    description: 'Move unseen and unheard', 
    worldId: 'world1', 
    difficulty: 'hard', 
    baseValue: 1, 
    minValue: 1, 
    maxValue: 10
  },
  { 
    id: 'lockpicking', 
    name: 'Lockpicking', 
    description: 'Open locked doors and containers', 
    worldId: 'world1', 
    difficulty: 'medium', 
    baseValue: 1, 
    minValue: 1, 
    maxValue: 10
  }
];

const decisionWithSkillRequirements: Decision = {
  id: 'decision-skill',
  prompt: 'You face a guarded treasure room. The guard blocks the door. How do you get past?',
  options: [
    {
      id: 'opt-intimidate',
      text: 'Intimidate the guard',
      hint: 'Use your commanding presence',
      requirements: [{ type: 'skill', targetId: 'intimidation', operator: 'gte', value: 6 }]
    },
    {
      id: 'opt-sneak',
      text: 'Sneak past when he\'s not looking',
      hint: 'Requires exceptional stealth',
      requirements: [{ type: 'skill', targetId: 'stealth', operator: 'gte', value: 7 }]
    },
    {
      id: 'opt-lockpick',
      text: 'Find a back entrance and pick the lock',
      hint: 'Technical approach',
      requirements: [{ type: 'skill', targetId: 'lockpicking', operator: 'gte', value: 5 }]
    },
    {
      id: 'opt-unknown',
      text: 'Use ancient magic',
      hint: 'Requires mystical knowledge',
      requirements: [{ type: 'skill', targetId: 'arcane-magic', operator: 'gte', value: 10 }]
    },
    {
      id: 'opt-normal',
      text: 'Ask politely',
      hint: 'Sometimes the simple approach works'
    }
  ],
};

export const WithSkillRequirements: Story = {
  args: {
    decision: decisionWithSkillRequirements,
    character: mockCharacter,
    worldSkills: mockWorldSkills,
    showHints: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows choices with skill requirements. Green badges indicate available skills, gray indicates unavailable skills. Character has Intimidation 8, Stealth 4, and Lockpicking 6.',
      },
    },
  },
};

