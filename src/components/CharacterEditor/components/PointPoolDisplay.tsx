import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface PointPool {
  total: number;
  spent: number;
  remaining: number;
}

interface PointPoolDisplayProps {
  pool: PointPool;
  label?: string;
}

export const PointPoolDisplay: React.FC<PointPoolDisplayProps> = ({
  pool,
  label = 'Point Pool',
}) => {
  const isOverBudget = pool.remaining < 0;
  const statusText = isOverBudget
    ? `Over budget by ${Math.abs(pool.remaining)} points!`
    : pool.remaining === 0
      ? 'All points allocated!'
      : `${pool.remaining} points remaining`;

  return (
    <div
      className={clsx(
        'component-point-pool-display',
        isOverBudget && 'is-over-budget'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div>
        <div>
          <span>{label}</span>
          <div className="component-point-pool-display-stats">
            <span>
              Total: <span>{pool.total}</span>
            </span>
            <span className={clsx(isOverBudget && 'point-pool-over-budget')}>
              {isOverBudget ? `Over budget: ${Math.abs(pool.remaining)}` : `Remaining: ${pool.remaining}`}
            </span>
          </div>
        </div>
        <div>
          {pool.remaining === 0 && (
            <span>
              <CheckCircle aria-hidden="true" />
              All allocated!
            </span>
          )}
          {isOverBudget && (
            <span className="point-pool-error-tag">
              <AlertCircle aria-hidden="true" />
              Over budget!
            </span>
          )}
        </div>
      </div>
      <span className="sr-only">{statusText}</span>
    </div>
  );
};
