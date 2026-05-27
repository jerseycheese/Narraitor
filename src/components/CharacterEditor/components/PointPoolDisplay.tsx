import React from 'react';
import { CheckCircle } from 'lucide-react';

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
  const statusText =
    pool.remaining === 0
      ? 'All points allocated!'
      : `${pool.remaining} points remaining`;

  return (
    <div
      className="component-point-pool-display"
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
            <span>
              Remaining: {pool.remaining}
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
        </div>
      </div>
      <span className="sr-only">{statusText}</span>
    </div>
  );
};
