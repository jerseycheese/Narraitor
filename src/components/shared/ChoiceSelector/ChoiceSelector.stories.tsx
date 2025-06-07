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

// === DECISION WEIGHT STORIES ===

export const MinorDecision: Story = {
  args: {
    decision: {
      id: 'minor-decision',
      prompt: 'What will you have for breakfast?',
      options: [
        { id: 'toast', text: 'Toast with jam', alignment: 'neutral' },
        { id: 'cereal', text: 'Bowl of cereal', alignment: 'neutral' },
        { id: 'skip', text: 'Skip breakfast', alignment: 'chaotic' },
      ],
      decisionWeight: 'minor',
      contextSummary: 'A simple morning choice with little consequence.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Minor decisions have subtle styling with minimal visual prominence.',
      },
    },
  },
};

export const MajorDecision: Story = {
  args: {
    decision: {
      id: 'major-decision',
      prompt: 'The dragon offers you a deal. How do you respond?',
      options: [
        { id: 'accept', text: 'Accept the dragon\'s terms', alignment: 'lawful' },
        { id: 'negotiate', text: 'Try to negotiate better terms', alignment: 'neutral' },
        { id: 'refuse', text: 'Refuse and stand your ground', alignment: 'chaotic' },
      ],
      decisionWeight: 'major',
      contextSummary: 'A significant choice that will shape your relationship with the ancient dragon.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Major decisions have amber borders and enhanced visual prominence to indicate importance.',
      },
    },
  },
};

export const CriticalDecision: Story = {
  args: {
    decision: {
      id: 'critical-decision',
      prompt: 'The kingdom\'s fate hangs in the balance. What is your final choice?',
      options: [
        { id: 'sacrifice', text: 'Sacrifice yourself to save the kingdom', alignment: 'lawful' },
        { id: 'bargain', text: 'Attempt a desperate bargain with fate', alignment: 'neutral' },
        { id: 'seize', text: 'Seize power and rule through force', alignment: 'chaotic' },
      ],
      decisionWeight: 'critical',
      contextSummary: 'The climactic moment where your choice will determine the fate of thousands.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical decisions have red borders, shadows, and maximum visual prominence for life-changing moments.',
      },
    },
  },
};

