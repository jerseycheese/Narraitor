import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChoiceHistorySection } from '../ChoiceHistorySection';
import type { DecisionHistoryEntry, DecisionOption, NarrativeSegment } from '@/types/narrative.types';

const buildSegment = (overrides: Partial<NarrativeSegment>): NarrativeSegment => ({
  id: 'segment-1',
  content: 'The villagers celebrate your choice.',
  type: 'scene',
  metadata: {
    tags: [],
    location: 'Market square',
    causedByDecisionId: 'decision-1',
    decisionOutcome: 'success',
  },
  timestamp: new Date('2025-01-01T12:10:00Z'),
  createdAt: '2025-01-01T12:10:00Z',
  updatedAt: '2025-01-01T12:10:00Z',
  ...overrides,
});

const buildDecisionEntry = (overrides: Partial<DecisionHistoryEntry> = {}): DecisionHistoryEntry => ({
  decision: {
    id: 'decision-1',
    prompt: 'How do you respond?',
    options: [
      { id: 'option-1', text: 'Offer help' },
      { id: 'option-2', text: 'Walk away' },
    ] as DecisionOption[],
    selectedOptionId: 'option-1',
    selectedAt: new Date('2025-01-01T12:05:00Z'),
    decisionWeight: 'major',
  },
  outcomeSegment: buildSegment({ id: 'segment-1' }),
  ...overrides,
});

describe('ChoiceHistorySection', () => {
  it('renders choice history entries with outcome details', () => {
    const entries: DecisionHistoryEntry[] = [
      buildDecisionEntry(),
      buildDecisionEntry({
        decision: {
          id: 'decision-2',
          prompt: 'A second choice appears.',
          options: [
            { id: 'option-3', text: 'Stand guard' },
            { id: 'option-4', text: 'Seek allies' },
          ] as DecisionOption[],
          selectedOptionId: 'option-3',
          selectedAt: new Date('2025-01-01T12:15:00Z'),
          decisionWeight: 'minor',
        },
        outcomeSegment: undefined,
      }),
    ];

    render(
      <ChoiceHistorySection
        sessionId="session-1"
        entries={entries}
        initialCollapsed={false}
      />
    );

    expect(screen.getByText('Offer help')).toBeInTheDocument();
    expect(screen.getByText(/Market square/i)).toBeInTheDocument();
    expect(screen.getByText(/villagers celebrate/i)).toBeInTheDocument();
    expect(screen.getByText(/Impact unknown yet/i)).toBeInTheDocument();
  });

  it('shows empty state when no entries exist', () => {
    render(
      <ChoiceHistorySection
        sessionId="session-1"
        entries={[]}
      />
    );

    expect(screen.getByText(/No recorded choices yet/i)).toBeInTheDocument();
  });
});
