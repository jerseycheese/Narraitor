import React from 'react';
import { render, screen } from '@testing-library/react';
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
  const state = {
    decisions: { 'decision-1': decision },
    sessionDecisions: { 'session-1': ['decision-1'] },
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
    getAllDecisions: () => [
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
      choiceDistribution: { chaotic: 1 },
      patternStrength: 100,
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
    expect(screen.getByTestId('decision-flow-trace-decision-1')).toBeInTheDocument();
    expect(screen.getByText('A guard blocks the gate')).toBeInTheDocument();
    expect(screen.getByText('Bribe the guard')).toBeInTheDocument();
    expect(screen.getByText('Ask politely')).toBeInTheDocument();
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
    expect(screen.getByTestId('decision-flow-tracker-record')).toBeInTheDocument();
  });

  it('shows the outcome segment and its prompt debug info', () => {
    render(<DecisionFlowSection />);

    expect(screen.getByText(/waves you through/)).toBeInTheDocument();
    expect(screen.getByTestId('decision-flow-debug-info')).toBeInTheDocument();
    expect(screen.getByText('Scene Template')).toBeInTheDocument();
    expect(screen.getByText('FULL PROMPT TEXT')).toBeInTheDocument();
  });
});
