import type { Meta, StoryObj } from '@storybook/react';
import ChoiceSelector from './ChoiceSelector';
import { Decision } from '@/types/narrative.types';

const meta: Meta<typeof ChoiceSelector> = {
  title: 'Narraitor/Narrative/Input/ChoiceSelector',
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
      alignment: 'neutral',
    },
    {
      id: 'opt-2',
      text: 'Force the door open',
      hint: 'Requires high Strength',
      alignment: 'chaotic',
    },
    {
      id: 'opt-3',
      text: 'Look for another way',
      hint: 'Safe but time-consuming',
      alignment: 'lawful',
    },
  ],
  decisionWeight: 'minor',
  contextSummary: 'A locked door blocks your path forward.',
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
  ],
  decisionWeight: 'major',
  contextSummary: 'Armed bandits block your path, forcing a decision that could determine your fate.',
});

export const AlignedChoices: Story = {
  args: {
    decision: createAlignedDecision(),
    showHints: true,
  },
};

// Decision with skill requirements for testing
const createSkillRequirementDecision = (): Decision => ({
  id: 'skill-requirement-decision',
  prompt: 'A locked chest sits before you, heavy with treasure. How do you proceed?',
  options: [
    {
      id: 'option-lockpick',
      text: 'Carefully pick the lock',
      alignment: 'neutral',
      hint: 'Requires deft fingers and patience',
      requirements: [{ type: 'skill', targetId: 'lockpicking', operator: 'gte', value: 5 }]
    },
    {
      id: 'option-force',
      text: 'Smash it open with brute force',
      alignment: 'chaotic',
      hint: 'Might damage the contents',
      requirements: [{ type: 'skill', targetId: 'strength', operator: 'gte', value: 8 }]
    },
    {
      id: 'option-magic',
      text: 'Use magic to unlock it',
      alignment: 'neutral',
      hint: 'A more elegant solution',
      requirements: [{ type: 'skill', targetId: 'magic', operator: 'gte', value: 6 }]
    },
    {
      id: 'option-search',
      text: 'Search for a hidden key',
      alignment: 'lawful',
      hint: 'Safe but time-consuming'
      // No requirements - anyone can try this
    }
  ],
  decisionWeight: 'major',
  contextSummary: 'A treasure chest awaits, but it requires skill to open safely.',
});

// Mock character for testing
const createMockCharacter = () => ({
  id: 'test-char',
  name: 'Test Character',
  description: 'A test character',
  worldId: 'test-world',
  attributes: [],
  skills: [
    { id: 'skill1', characterId: 'test-char', worldSkillId: 'lockpicking', name: 'Lockpicking', level: 7 },
    { id: 'skill2', characterId: 'test-char', worldSkillId: 'strength', name: 'Strength', level: 4 },
    { id: 'skill3', characterId: 'test-char', worldSkillId: 'magic', name: 'Magic', level: 9 }
  ],
  background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
  inventory: { characterId: 'test-char', items: [], capacity: 20, categories: [] },
  status: { health: 100, maxHealth: 100, conditions: [] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Mock world skills
const createMockWorldSkills = () => [
  { id: 'lockpicking', name: 'Lockpicking', description: '', worldId: 'test-world', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
  { id: 'strength', name: 'Strength', description: '', worldId: 'test-world', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 10 },
  { id: 'magic', name: 'Magic', description: '', worldId: 'test-world', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 10 }
];

export const WithSkillRequirements: Story = {
  args: {
    decision: createSkillRequirementDecision(),
    character: createMockCharacter(),
    worldSkills: createMockWorldSkills(),
    showHints: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows choices with skill requirements. Green badges indicate the character meets the requirement, gray badges indicate they do not. This character has Lockpicking 7 (✓), Strength 4 (✗), and Magic 9 (✓).',
      },
    },
  },
};


