'use client';

import React from 'react';
import { clsx } from 'clsx';
import { useCalibrationStore } from '@/state/calibrationStore';
import {
  DEFAULT_TOTAL_BUDGET,
  type PromptCalibrationSnapshot,
} from '@/lib/promptContext/promptCalibration';
import './TokenBudgetPanel.css';

type UtilizationLevel = 'ok' | 'warn' | 'high' | 'over';

const utilization = (estimated: number, total: number): number => {
  if (total > 0) return estimated / total;
  return estimated > 0 ? Infinity : 0;
};

const levelFor = (ratio: number): UtilizationLevel => {
  if (ratio > 1) return 'over';
  if (ratio >= 0.9) return 'high';
  if (ratio >= 0.7) return 'warn';
  return 'ok';
};

const formatTokens = (value: number): string => Math.round(value).toLocaleString();

const EMPTY_SNAPSHOT: PromptCalibrationSnapshot = {
  totalBudget: DEFAULT_TOTAL_BUDGET,
  estimated: 0,
};

const UsageBar = ({ snapshot }: { snapshot: PromptCalibrationSnapshot }) => {
  const ratio = utilization(snapshot.estimated, snapshot.totalBudget);
  const level = levelFor(ratio);
  const fillPct = Number.isFinite(ratio) ? Math.min(100, ratio * 100) : 100;

  return (
    <div
      className="token-budget-panel-row"
      data-testid="token-budget-row-request-total"
      data-level={level}
    >
      <div className="token-budget-panel-row-head">
        <span className="token-budget-panel-component">whole prompt</span>
        <span className="token-budget-panel-numbers">
          {formatTokens(snapshot.estimated)} / {formatTokens(snapshot.totalBudget)}
        </span>
      </div>

      <div className="token-budget-panel-bar" role="presentation">
        <div
          className={clsx('token-budget-panel-bar-fill', `is-${level}`)}
          data-testid="token-budget-bar-request-total"
          style={{ transform: `translateX(${fillPct - 100}%)` }}
        />
      </div>
    </div>
  );
};

const CalibrationSummary = ({
  snapshot,
}: {
  snapshot: PromptCalibrationSnapshot;
}) => {
  const hasActual = typeof snapshot.actual === 'number';

  return (
    <div className="token-budget-panel-calibration" data-testid="token-budget-calibration">
      <h5 className="token-budget-panel-subheading">Estimate accuracy</h5>
      {hasActual ? (
        <div className="token-budget-panel-calibration-figures">
          <span data-testid="token-budget-accuracy">
            {snapshot.accuracy !== undefined
              ? `${snapshot.accuracy.toFixed(2)}×`
              : 'n/a'}
          </span>
          <span className="token-budget-panel-numbers">
            actual {formatTokens(snapshot.actual as number)} / estimated{' '}
            {formatTokens(snapshot.estimated)}
          </span>
        </div>
      ) : (
        <p
          className="token-budget-panel-empty"
          data-testid="token-budget-calibration-empty"
        >
          n/a until a provider token count is available (generate a narrative
          segment with a live API key).
        </p>
      )}
    </div>
  );
};

/**
 * TokenBudgetPanel
 *
 * Dev-only observability for prompt size. Shows what the last request's whole
 * prompt weighed against a reference figure, plus how the heuristic estimate
 * compared to the provider's own token count.
 *
 * Measurement only — nothing here trims a prompt. Components are bounded where
 * they are assembled, so there is no per-component ceiling to report against.
 */
export const TokenBudgetPanel = () => {
  const snapshots = useCalibrationStore((state) => state.snapshots);
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const snapshot = latest ?? EMPTY_SNAPSHOT;

  return (
    <div className="token-budget-panel" data-testid="devtools-token-budget-panel">
      <div className="token-budget-panel-meta">
        <span data-testid="token-budget-status">
          {latest ? 'Latest request' : 'No request captured yet'}
        </span>
      </div>

      <div className="token-budget-panel-rows">
        <UsageBar snapshot={snapshot} />
      </div>

      <CalibrationSummary snapshot={snapshot} />
    </div>
  );
};
