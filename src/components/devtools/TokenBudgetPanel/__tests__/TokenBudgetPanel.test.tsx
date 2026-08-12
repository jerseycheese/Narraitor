import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenBudgetPanel } from '../TokenBudgetPanel';
import { useCalibrationStore } from '@/state/calibrationStore';
import {
  ComponentPriority,
  DEFAULT_COMPONENT_BUDGETS,
  type TokenBudgetSnapshot,
} from '@/lib/promptContext/tokenBudgetManager';

jest.mock('@/state/calibrationStore', () => ({
  useCalibrationStore: jest.fn(),
}));

const mockStore = useCalibrationStore as unknown as jest.Mock;

/** Drive the panel with a fixed list of snapshots via the selector hook. */
const withSnapshots = (snapshots: TokenBudgetSnapshot[]) => {
  mockStore.mockImplementation((selector: (s: { snapshots: TokenBudgetSnapshot[] }) => unknown) =>
    selector({ snapshots })
  );
};

const sampleSnapshot: TokenBudgetSnapshot = {
  enabled: true,
  totalBudget: 80000,
  components: [
    // 0.5 -> ok
    { componentId: 'base-template', priority: ComponentPriority.CRITICAL, allocation: 300, estimated: 150 },
    // 0.75 -> warn
    { componentId: 'goals', priority: ComponentPriority.HIGH, allocation: 300, estimated: 225 },
    // 0.95 -> high
    { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, allocation: 800, estimated: 760 },
    // 1.3 -> over
    { componentId: 'examples', priority: ComponentPriority.LOW, allocation: 200, estimated: 260 },
  ],
  calibration: {
    componentId: 'request-total',
    estimated: 2000,
    actual: 2200,
    accuracy: 1.1,
  },
};

describe('TokenBudgetPanel', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders a row per component from the latest snapshot', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('devtools-token-budget-panel')).toBeInTheDocument();
    expect(screen.getByTestId('token-budget-status')).toHaveTextContent('Latest request');
    for (const component of sampleSnapshot.components) {
      expect(
        screen.getByTestId(`token-budget-row-${component.componentId}`)
      ).toBeInTheDocument();
    }
  });

  it('colors usage bars by utilization threshold', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-bar-base-template')).toHaveClass('is-ok');
    expect(screen.getByTestId('token-budget-bar-goals')).toHaveClass('is-warn');
    expect(screen.getByTestId('token-budget-bar-lore-context')).toHaveClass('is-high');
    expect(screen.getByTestId('token-budget-bar-examples')).toHaveClass('is-over');
  });

  it('slides each bar left by the share of its budget still unspent', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    // 150/300 spent, so half the track stays empty.
    expect(screen.getByTestId('token-budget-bar-base-template')).toHaveStyle({
      transform: 'translateX(-50%)',
    });
    // Over budget clamps to a full bar rather than overshooting the track.
    expect(screen.getByTestId('token-budget-bar-examples')).toHaveStyle({
      transform: 'translateX(0%)',
    });
  });

  it('flags over-budget components with a degradation suggestion', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-over-examples')).toBeInTheDocument();
    expect(screen.getByTestId('token-budget-suggestion-examples')).toHaveTextContent(
      /first to be dropped/i
    );

    // Components within budget carry no over-budget badge or suggestion.
    expect(screen.queryByTestId('token-budget-over-base-template')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('token-budget-suggestion-base-template')
    ).not.toBeInTheDocument();
  });

  it('shows calibration accuracy when an actual token count is present', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-accuracy')).toHaveTextContent('1.10×');
    expect(
      screen.queryByTestId('token-budget-calibration-empty')
    ).not.toBeInTheDocument();
  });

  it('shows the calibration empty state when no actual is available', () => {
    withSnapshots([
      { ...sampleSnapshot, calibration: { estimated: 2000, actual: undefined } },
    ]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-calibration-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('token-budget-accuracy')).not.toBeInTheDocument();
  });

  it('falls back to the static allocation config when no request is captured', () => {
    withSnapshots([]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-status')).toHaveTextContent(
      /No request captured yet/i
    );
    // Every configured component is shown from the default allocations.
    for (const allocation of DEFAULT_COMPONENT_BUDGETS) {
      expect(
        screen.getByTestId(`token-budget-row-${allocation.componentId}`)
      ).toBeInTheDocument();
    }
    expect(screen.getByTestId('token-budget-calibration-empty')).toBeInTheDocument();
  });
});
