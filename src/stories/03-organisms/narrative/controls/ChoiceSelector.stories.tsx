import type { Meta, StoryObj } from '@storybook/react';
import ChoiceSelector from '@/components/shared/ChoiceSelector/ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import type { InventoryItem } from '@/types/inventory.types';
import { getTimestamp } from '@/lib/utils';

const meta: Meta<typeof ChoiceSelector> = {
  title: '03-Organisms/narrative/controls/ChoiceSelector',
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
  contextSummary: 'Armed bandits your path, forcing a decision that could determine your fate.',
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
      text: 'Search for a key',
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
  createdAt: getTimestamp(),
  updatedAt: getTimestamp()
});

// Mock world skills
const createMockWorldSkills = () => [
  { id: 'lockpicking', name: 'Lockpicking', description: '', worldId: 'test-world', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
  { id: 'strength', name: 'Strength', description: '', worldId: 'test-world', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 10 },
  { id: 'magic', name: 'Magic', description: '', worldId: 'test-world', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 10 }
];

const createItemRequirementDecision = (): Decision => ({
  id: 'item-requirement-decision',
  prompt: 'The ancient vault resists entry unless you have the right tools. What will you do?',
  options: [
    {
      id: 'option-pick',
      text: 'Delicately pick the rune-etched lock',
      hint: 'Requires fine tools',
      requiredItems: [{ type: 'item', targetId: 'Lockpick', operator: 'gte', value: 1 }],
    },
    {
      id: 'option-brew',
      text: 'Brew a restorative salve for the wounded scout',
      hint: 'Needs multiple potions',
      requiredItems: [{ type: 'item', targetId: 'Healing Potion', operator: 'gte', value: 3 }],
    },
    {
      id: 'option-ward',
      text: 'Break the ward with a resonant talisman',
      hint: 'Either an arcane focus or a gifted key works',
      requiredItems: {
        logic: 'any',
        requirements: [
          { type: 'item', targetId: 'Arcane Focus', operator: 'gte', value: 1 },
          { type: 'item', targetId: 'Magic Key', operator: 'gte', value: 1 },
        ],
      },
    },
  ],
  decisionWeight: 'major',
  contextSummary: 'Foreign wards and injured allies make every choice matter.',
});

const createMockInventoryItems = (): InventoryItem[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'item-lockpick',
      name: 'Lockpick',
      description: 'Slim iron picks for delicate mechanisms.',
      quantity: 1,
      stackable: false,
      categoryId: 'equipment',
      acquisitionHistory: [],
      categorization: {
        categoryId: 'equipment',
        source: 'manual',
        classifiedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-potion',
      name: 'Healing Potion',
      description: 'Restores vitality when consumed.',
      quantity: 3,
      stackable: true,
      categoryId: 'consumables',
      acquisitionHistory: [],
      categorization: {
        categoryId: 'consumables',
        source: 'manual',
        classifiedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-fetish',
      name: 'Arcane Focus',
      description: 'Attuned crystal that channels ward-breaking resonance.',
      quantity: 1,
      stackable: false,
      categoryId: 'quest-items',
      acquisitionHistory: [],
      categorization: {
        categoryId: 'quest-items',
        source: 'manual',
        classifiedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const WithSkillRequirements: Story = {
  args: {
    decision: createSkillRequirementDecision(),
    characterSkills: createMockCharacter().skills,
    worldSkills: createMockWorldSkills(),
    inventoryItems: [],
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

export const WithItemRequirements: Story = {
  args: {
    decision: createItemRequirementDecision(),
    characterSkills: createMockCharacter().skills,
    worldSkills: createMockWorldSkills(),
    inventoryItems: createMockInventoryItems(),
    showHints: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates inventory-gated choices. The character carries lockpicks, potions, and an arcane focus, so two options unlock while the missing magic key keeps the ward option highlighted as unavailable.',
      },
    },
  },
};

export const ManuscriptContext: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-surface-muted, hsl(0 0% 96%))', padding: '2rem', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <footer id="manuscript-action-rail" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface, hsl(0 0% 98% / 95%))', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-drawer)' }}>
          <Story />
        </footer>
      </div>
    ),
  ],
  args: {
    decision: decisionWithHints,
    enableCustomInput: true,
  },
};

export const ManuscriptStreaming: Story = {
  decorators: ManuscriptContext.decorators,
  args: {
    ...ManuscriptContext.args,
    isDisabled: true,
  },
};
