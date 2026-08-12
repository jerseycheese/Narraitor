import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenBudgetPanel } from '../TokenBudgetPanel';
import { useCalibrationStore } from '@/state/calibrationStore';
import type { PromptCalibrationSnapshot } from '@/lib/promptContext/promptCalibration';

jest.mock('@/state/calibrationStore', () => ({
  useCalibrationStore: jest.fn(),
}));

const mockStore = useCalibrationStore as unknown as jest.Mock;

/** Drive the panel with a fixed list of snapshots via the selector hook. */
const withSnapshots = (snapshots: PromptCalibrationSnapshot[]) => {
  mockStore.mockImplementation(
    (selector: (s: { snapshots: PromptCalibrationSnapshot[] }) => unknown) =>
      selector({ snapshots })
  );
};

const sampleSnapshot: PromptCalibrationSnapshot = {
  totalBudget: 80000,
  estimated: 40000,
  actual: 44000,
  accuracy: 1.1,
};

describe('TokenBudgetPanel', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the latest request against the reference figure', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('devtools-token-budget-panel')).toBeInTheDocument();
    expect(screen.getByTestId('token-budget-status')).toHaveTextContent('Latest request');
    expect(screen.getByTestId('token-budget-row-request-total')).toHaveTextContent(
      '40,000 / 80,000'
    );
  });

  it('colors the usage bar by utilization threshold', () => {
    withSnapshots([{ ...sampleSnapshot, estimated: 76000 }]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-bar-request-total')).toHaveClass('is-high');
  });

  it('slides the bar left by the share of the reference still unspent', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    // 40,000 of 80,000, so half the track stays empty.
    expect(screen.getByTestId('token-budget-bar-request-total')).toHaveStyle({
      transform: 'translateX(-50%)',
    });
  });

  it('clamps an over-reference bar to a full track', () => {
    withSnapshots([{ ...sampleSnapshot, estimated: 100000 }]);
    render(<TokenBudgetPanel />);

    const bar = screen.getByTestId('token-budget-bar-request-total');
    expect(bar).toHaveClass('is-over');
    expect(bar).toHaveStyle({ transform: 'translateX(0%)' });
  });

  it('shows calibration accuracy when an actual token count is present', () => {
    withSnapshots([sampleSnapshot]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-accuracy')).toHaveTextContent('1.10×');
    expect(
      screen.queryByTestId('token-budget-calibration-empty')
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when no request has been captured', () => {
    withSnapshots([]);
    render(<TokenBudgetPanel />);

    expect(screen.getByTestId('token-budget-status')).toHaveTextContent(
      /No request captured yet/i
    );
    expect(screen.getByTestId('token-budget-calibration-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('token-budget-accuracy')).not.toBeInTheDocument();
  });
});
