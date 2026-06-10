import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { DecisionFlowSection } from '../DecisionFlowSection';

jest.mock('@/state/narrativeStore', () => {
  const decision = {
    id: 'decision-1',
    prompt: 'A guard blocks the gate',
    options: [
      { id: 'option-1', text: 'Bribe the guard', alignment: 'chaotic' },
      { id: 'option-2', text: 'Ask politely', alignment: 'lawful', hint: 'Low risk' },
    ],
    selectedOptionId: 'option-1',
    selectedAt: new Date('2026-06-09T10:00:00.000Z'),
    decisionWeight: 'major',
    narrativeSegmentId: 'segment-1',
  };
  // Same session, same selected choice text as decision-1, but a different
  // prompt — the case that cross-links to the newest tracker record without a
  // prompt discriminator.
  const sameTextDecision = {
    id: 'decision-2',
    prompt: 'A toll collector demands payment',
    options: [{ id: 'option-3', text: 'Bribe the guard', alignment: 'chaotic' }],
    selectedOptionId: 'option-3',
    selectedAt: new Date('2026-06-09T11:00:00.000Z'),
    decisionWeight: 'minor',
  };
  const state = {
    decisions: { 'decision-1': decision, 'decision-2': sameTextDecision },
    sessionDecisions: { 'session-1': ['decision-1', 'decision-2'] },
    segments: {
      'segment-1': {
        id: 'segment-1',
        content: 'You approach the city gate at dusk.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date('2026-06-09T09:59:00.000Z'),
      },
      'segment-2': {
        id: 'segment-2',
        content: 'The guard pockets the coin and waves you through.',
        type: 'action',
        metadata: {
          tags: [],
          causedByDecisionId: 'decision-1',
          decisionOutcome: 'success',
          debugInfo: {
            fullPrompt: 'FULL PROMPT TEXT',
            templateName: 'Scene Template',
            modelUsed: 'gemini-2.5-flash',
            generatedAt: new Date('2026-06-09T10:00:05.000Z'),
          },
        },
        timestamp: new Date('2026-06-09T10:00:05.000Z'),
      },
    },
  };
  return { useNarrativeStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/lib/ai/playerDecisionTracker', () => ({
  playerDecisionTracker: {
    // Newest-first, as the tracker unshifts. Both records share choiceText
    // 'Bribe the guard' but differ in prompt.
    getAllDecisions: () => [
      {
        id: 'pd-2',
        prompt: 'A toll collector demands payment',
        choiceText: 'Bribe the guard',
        choiceType: 'aggressive',
        timestamp: '2026-06-09T11:00:00.000Z',
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {},
      },
      {
        id: 'pd-1',
        prompt: 'A guard blocks the gate',
        choiceText: 'Bribe the guard',
        choiceType: 'chaotic',
        timestamp: '2026-06-09T10:00:00.000Z',
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {},
      },
    ],
    analyzeChoicePatterns: () => ({
      dominantChoiceTypes: ['chaotic'],
      choiceDistribution: { chaotic: 1, aggressive: 1 },
      patternStrength: 50,
    }),
  },
}));

jest.mock('@/components/ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="collapsible-section">{title}{children}</div>
  ),
}));

jest.mock('../../JsonViewer', () => ({
  JsonViewer: ({ data }: { data: unknown }) => (
    <pre data-testid="json-viewer">{JSON.stringify(data)}</pre>
  ),
}));

describe('DecisionFlowSection', () => {
  it('renders the decision trace with its options', () => {
    render(<DecisionFlowSection />);

    expect(screen.getByTestId('devtools-decision-flow-section')).toBeInTheDocument();
    const trace = screen.getByTestId('decision-flow-trace-decision-1');
    expect(trace).toBeInTheDocument();
    expect(within(trace).getByText('A guard blocks the gate')).toBeInTheDocument();
    expect(within(trace).getByText('Bribe the guard')).toBeInTheDocument();
    expect(within(trace).getByText('Ask politely')).toBeInTheDocument();
  });

  it('marks the selected option and links the tracker record', () => {
    render(<DecisionFlowSection />);

    expect(screen.getByTestId('decision-flow-option-option-1')).toHaveAttribute(
      'data-selected',
      'true'
    );
    expect(screen.getByTestId('decision-flow-option-option-2')).not.toHaveAttribute(
      'data-selected'
    );
    const trace = screen.getByTestId('decision-flow-trace-decision-1');
    expect(within(trace).getByTestId('decision-flow-tracker-record')).toBeInTheDocument();
  });

  it('shows the outcome segment and its prompt debug info', () => {
    render(<DecisionFlowSection />);

    expect(screen.getByText(/waves you through/)).toBeInTheDocument();
    expect(screen.getByTestId('decision-flow-debug-info')).toBeInTheDocument();
    expect(screen.getByText('Scene Template')).toBeInTheDocument();
    expect(screen.getByText('FULL PROMPT TEXT')).toBeInTheDocument();
  });

  it('matches the tracker record by prompt, not just choice text', () => {
    render(<DecisionFlowSection />);

    // decision-1 ("A guard blocks the gate") and decision-2 ("A toll collector
    // demands payment") both selected "Bribe the guard". Matching on choice
    // text alone would link decision-1 to the newest record (aggressive);
    // the prompt discriminator keeps it on its own record (chaotic).
    const trace1 = screen.getByTestId('decision-flow-trace-decision-1');
    const record1 = within(trace1).getByTestId('decision-flow-tracker-record');
    expect(within(record1).getByText('chaotic')).toBeInTheDocument();
    expect(within(record1).queryByText('aggressive')).not.toBeInTheDocument();
  });
});
