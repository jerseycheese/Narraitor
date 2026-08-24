import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorldClockSection } from '../WorldClockSection';

type MockState = Record<string, unknown>;

// Each store hook is called with a selector, so the mocks apply it to a state
// object. The factories are self-contained because jest hoists them above
// module-scope helpers.
jest.mock('@/state/sessionStore', () => {
  const state = { id: 'session-1' };
  return { useSessionStore: (selector: (s: typeof state) => unknown) => selector(state) };
});
jest.mock('@/state/narrativeStore', () => {
  const state = {
    sessionSegments: { 'session-1': ['seg-1', 'seg-2', 'seg-item', 'seg-3', 'seg-4', 'seg-5', 'seg-6'] },
    segments: {
      'seg-1': { metadata: { tags: [] } },
      'seg-2': { metadata: { tags: [] } },
      'seg-item': { metadata: { tags: ['item-usage'] } },
      'seg-3': { metadata: { tags: [] } },
      'seg-4': { metadata: { tags: [] } },
      'seg-5': { metadata: { tags: [] } },
      'seg-6': { metadata: { tags: [] } },
    },
  };
  return { useNarrativeStore: (selector: (s: typeof state) => unknown) => selector(state) };
});
jest.mock('@/state/worldThreadStore', () => {
  const state: Record<string, unknown> = { threads: {}, sessionThreads: {}, hasSessionLedger: () => false };
  const hook = (selector: (s: Record<string, unknown>) => unknown) => selector(state);
  return {
    useWorldThreadStore: Object.assign(hook, {
      setState: (next: Record<string, unknown>) => Object.assign(state, next),
    }),
  };
});

const worldThreadStore = jest.requireMock('@/state/worldThreadStore').useWorldThreadStore as {
  setState: (next: MockState) => void;
};

const thread = (overrides: MockState) => ({
  id: 'thread-x',
  sessionId: 'session-1',
  worldId: 'world-1',
  kind: 'consequence',
  summary: 'The guard captain wants the stolen seal back',
  openedAtTurn: 1,
  lastAdvancedAtTurn: 3,
  status: 'open',
  notes: [],
  createdAt: '2026-08-17T00:00:00.000Z',
  updatedAt: '2026-08-17T00:00:00.000Z',
  ...overrides,
});

describe('WorldClockSection', () => {
  it('shows the empty state when the session has no ledger', () => {
    worldThreadStore.setState({ threads: {}, sessionThreads: {}, hasSessionLedger: () => false });

    render(<WorldClockSection />);

    expect(screen.getByTestId('devtools-world-clock-section')).toBeInTheDocument();
    expect(screen.getByTestId('world-clock-empty')).toHaveTextContent('No ledger for this session yet.');
  });

  it('renders the summary line and marks overdue threads', () => {
    const threads = {
      't-open': thread({ id: 't-open', lastAdvancedAtTurn: 4 }),
      't-late': thread({ id: 't-late', kind: 'deadline', summary: 'The tide turns at dawn', dueByTurn: 5 }),
      't-done': thread({ id: 't-done', kind: 'actor', summary: 'Mira rides for the capital', status: 'resolved', resolution: 'She arrived', lastAdvancedAtTurn: 2 }),
    };
    worldThreadStore.setState({
      threads,
      sessionThreads: { 'session-1': ['t-open', 't-late', 't-done'] },
      hasSessionLedger: (id: string) => id === 'session-1',
    });

    render(<WorldClockSection />);

    expect(screen.getByTestId('world-clock-summary')).toHaveTextContent(
      'Turn 6: 2 open, 1 overdue, world last moved 2 turns ago'
    );
    expect(screen.getAllByTestId('world-clock-open-thread')).toHaveLength(2);
    expect(screen.getByText('The tide turns at dawn').closest('li')).toHaveAttribute('data-overdue', 'true');
    expect(screen.getByTestId('world-clock-closed-thread')).toHaveTextContent('resolved t2: She arrived');
  });
});
