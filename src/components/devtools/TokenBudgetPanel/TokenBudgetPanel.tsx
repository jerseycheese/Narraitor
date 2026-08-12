'use client';

import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/badge';
import { useCalibrationStore } from '@/state/calibrationStore';
import {
  RequestBudget,
  ComponentPriority,
  DEFAULT_COMPONENT_BUDGETS,
  DEFAULT_TOTAL_BUDGET,
  type ComponentBudgetUsage,
  type TokenBudgetSnapshot,
} from '@/lib/promptContext/tokenBudgetManager';
import './TokenBudgetPanel.css';

type UtilizationLevel = 'ok' | 'warn' | 'high' | 'over';

const PRIORITY_LABELS: Record<ComponentPriority, string> = {
  [ComponentPriority.CRITICAL]: 'Critical',
  [ComponentPriority.HIGH]: 'High',
  [ComponentPriority.MEDIUM]: 'Medium',
  [ComponentPriority.LOW]: 'Low',
};

/**
 * Degradation guidance for an over-budget component, keyed by how aggressively
 * the budget resolver drops it under pressure.
 */
const DEGRADATION_SUGGESTIONS: Record<ComponentPriority, string> = {
  [ComponentPriority.CRITICAL]:
    'Critical component — cannot be dropped; trim its source content to recover budget.',
  [ComponentPriority.HIGH]:
    'High priority — truncated only when budget is tight; consider trimming content.',
  [ComponentPriority.MEDIUM]:
    'Medium priority — degraded when budget runs low.',
  [ComponentPriority.LOW]:
    'Low priority — first to be dropped under budget pressure.',
};

const utilization = (estimated: number, allocation: number): number => {
  if (allocation > 0) return estimated / allocation;
  return estimated > 0 ? Infinity : 0;
};

const levelFor = (ratio: number): UtilizationLevel => {
  if (ratio > 1) return 'over';
  if (ratio >= 0.9) return 'high';
  if (ratio >= 0.7) return 'warn';
  return 'ok';
};

const formatTokens = (value: number): string => Math.round(value).toLocaleString();

/**
 * A zero-usage snapshot so the panel can show the component limits before any
 * request has been captured.
 */
const buildFallbackSnapshot = (): TokenBudgetSnapshot =>
  new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true).getSnapshot();

const UsageRow = ({ component }: { component: ComponentBudgetUsage }) => {
  const ratio = utilization(component.estimated, component.allocation);
  const level = levelFor(ratio);
  const isOver = level === 'over';
  const fillPct = Number.isFinite(ratio) ? Math.min(100, ratio * 100) : 100;

  return (
    <div
      className="token-budget-panel-row"
      data-testid={`token-budget-row-${component.componentId}`}
      data-level={level}
    >
      <div className="token-budget-panel-row-head">
        <span className="token-budget-panel-component">{component.componentId}</span>
        <Badge variant="outline-static" size="sm" className="token-budget-panel-priority">
          {PRIORITY_LABELS[component.priority]}
        </Badge>
        {isOver && (
          <Badge
            variant="destructive-static"
            size="sm"
            data-testid={`token-budget-over-${component.componentId}`}
          >
            Over budget
          </Badge>
        )}
        <span className="token-budget-panel-numbers">
          {formatTokens(component.estimated)} / {formatTokens(component.allocation)}
        </span>
      </div>

      <div className="token-budget-panel-bar" role="presentation">
        <div
          className={clsx('token-budget-panel-bar-fill', `is-${level}`)}
          data-testid={`token-budget-bar-${component.componentId}`}
          style={{ transform: `translateX(${fillPct - 100}%)` }}
        />
      </div>

      {isOver && (
        <p
          className="token-budget-panel-suggestion"
          data-testid={`token-budget-suggestion-${component.componentId}`}
        >
          {DEGRADATION_SUGGESTIONS[component.priority]}
        </p>
      )}
    </div>
  );
};

const CalibrationSummary = ({
  calibration,
}: {
  calibration: TokenBudgetSnapshot['calibration'];
}) => {
  const hasActual = typeof calibration.actual === 'number';

  return (
    <div className="token-budget-panel-calibration" data-testid="token-budget-calibration">
      <h5 className="token-budget-panel-subheading">Estimate accuracy</h5>
      {hasActual ? (
        <div className="token-budget-panel-calibration-figures">
          <span data-testid="token-budget-accuracy">
            {calibration.accuracy !== undefined
              ? `${calibration.accuracy.toFixed(2)}×`
              : 'n/a'}
          </span>
          <span className="token-budget-panel-numbers">
            actual {formatTokens(calibration.actual as number)} / estimated{' '}
            {formatTokens(calibration.estimated)}
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
 * Dev-only observability for the prompt token-budget system (#1333). Surfaces
 * per-component allocation and usage bars, over-budget degradation guidance,
 * and request-level estimate-vs-actual calibration captured after each
 * narrative generation. Reads the latest snapshot from the calibration store
 * and falls back to the static allocation config before any request is seen.
 */
export const TokenBudgetPanel = () => {
  const snapshots = useCalibrationStore((state) => state.snapshots);

  const { snapshot, isLive } = useMemo(() => {
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    return latest
      ? { snapshot: latest, isLive: true }
      : { snapshot: buildFallbackSnapshot(), isLive: false };
  }, [snapshots]);

  return (
    <div className="token-budget-panel" data-testid="devtools-token-budget-panel">
      <div className="token-budget-panel-meta">
        <span data-testid="token-budget-status">
          {isLive ? 'Latest request' : 'No request captured yet — showing allocation config'}
        </span>
        <span className="token-budget-panel-numbers">
          Total budget {formatTokens(snapshot.totalBudget)} ·{' '}
          {snapshot.enabled ? 'enforcement on' : 'enforcement off'}
        </span>
      </div>

      <div className="token-budget-panel-rows">
        {snapshot.components.map((component) => (
          <UsageRow key={component.componentId} component={component} />
        ))}
      </div>

      <CalibrationSummary calibration={snapshot.calibration} />
    </div>
  );
};
