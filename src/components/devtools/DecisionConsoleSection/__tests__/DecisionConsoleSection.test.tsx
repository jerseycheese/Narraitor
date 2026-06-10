import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DecisionConsoleSection } from '../DecisionConsoleSection';

const trackerDecisions = [
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
  {
    id: 'pd-2',
    prompt: 'The merchant offers a deal',
    choiceText: 'Negotiate a fair price',
    choiceType: 'diplomatic',
    timestamp: '2026-06-09T11:00:00.000Z',
    sessionId: 'session-1',
    worldId: 'world-2',
    context: {},
  },
];

jest.mock('@/lib/ai/playerDecisionTracker', () => ({
  playerDecisionTracker: {
    getAllDecisions: () => trackerDecisions,
    analyzeChoicePatterns: () => ({
      dominantChoiceTypes: ['chaotic', 'diplomatic'],
      choiceDistribution: { chaotic: 1, diplomatic: 1 },
      patternStrength: 50,
    }),
  },
}));

jest.mock('@/state/narrativeStore', () => {
  const state = { decisions: {}, sessionDecisions: {}, segments: {} };
  return { useNarrativeStore: Object.assign(() => state, { getState: () => state }) };
});

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

describe('DecisionConsoleSection', () => {
  it('renders tracked decisions with pattern analysis', () => {
    render(<DecisionConsoleSection />);

    expect(screen.getByTestId('devtools-decision-console-section')).toBeInTheDocument();
    expect(screen.getByText('A guard blocks the gate')).toBeInTheDocument();
    expect(screen.getByText('The merchant offers a deal')).toBeInTheDocument();
    expect(screen.getByTestId('decision-console-patterns')).toBeInTheDocument();
    expect(screen.getByText(/Pattern strength 50%/)).toBeInTheDocument();
  });

  it('filters decisions by search text', () => {
    render(<DecisionConsoleSection />);

    fireEvent.change(screen.getByTestId('decision-console-search'), {
      target: { value: 'merchant' },
    });

    expect(screen.getByText('The merchant offers a deal')).toBeInTheDocument();
    expect(screen.queryByText('A guard blocks the gate')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 2/)).toBeInTheDocument();
  });

  it('filters decisions by world', () => {
    render(<DecisionConsoleSection />);

    fireEvent.change(screen.getByTestId('decision-console-world-filter'), {
      target: { value: 'world-1' },
    });

    expect(screen.getByText('A guard blocks the gate')).toBeInTheDocument();
    expect(screen.queryByText('The merchant offers a deal')).not.toBeInTheDocument();
  });

  it('exports the filtered decisions as a JSON download', () => {
    const createObjectURL = jest.fn(() => 'blob:mock');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<DecisionConsoleSection />);
    fireEvent.click(screen.getByTestId('decision-console-export'));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');

    clickSpy.mockRestore();
  });
});
