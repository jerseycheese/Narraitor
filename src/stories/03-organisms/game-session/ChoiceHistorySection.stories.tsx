import type { Meta, StoryObj } from '@storybook/react';
import { ChoiceHistorySection } from '@/components/GameSession/ChoiceHistorySection';
import type { DecisionHistoryEntry, DecisionOption, NarrativeSegment } from '@/types/narrative.types';

const buildSegment = (overrides: Partial<NarrativeSegment>): NarrativeSegment => ({
  id: 'segment-1',
  content: 'The crowd erupts as your ally steps forward with a plan.',
  type: 'scene',
  metadata: {
    tags: [],
    location: 'Citadel plaza',
    causedByDecisionId: 'decision-1',
    decisionOutcome: 'success',
  },
  timestamp: new Date('2025-01-01T12:10:00Z'),
  createdAt: '2025-01-01T12:10:00Z',
  updatedAt: '2025-01-01T12:10:00Z',
  ...overrides,
});

const entries: DecisionHistoryEntry[] = [
  {
    decision: {
      id: 'decision-1',
      prompt: 'The council asks how you will respond to the uprising.',
      options: [
        { id: 'option-1', text: 'Negotiate a ceasefire' },
        { id: 'option-2', text: 'Mobilize the guard' },
      ] as DecisionOption[],
      selectedOptionId: 'option-1',
      selectedAt: new Date('2025-01-01T12:05:00Z'),
      decisionWeight: 'major',
    },
    outcomeSegment: buildSegment({
      id: 'segment-1',
    }),
  },
  {
    decision: {
      id: 'decision-2',
      prompt: 'A wounded scout needs help. What do you do?',
      options: [
        { id: 'option-3', text: 'Tend to the scout' },
        { id: 'option-4', text: 'Press on to the gate' },
      ] as DecisionOption[],
      selectedOptionId: 'option-3',
      selectedAt: new Date('2025-01-01T12:20:00Z'),
      decisionWeight: 'minor',
    },
  },
];

const meta: Meta<typeof ChoiceHistorySection> = {
  title: '03-Organisms/game-session/ChoiceHistorySection',
  component: ChoiceHistorySection,
  parameters: {
    layout: 'padded',
  },
  args: {
    sessionId: 'session-1',
    entries,
    initialCollapsed: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    entries: [],
    initialCollapsed: false,
  },
};
