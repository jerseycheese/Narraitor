import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cssClasses } from '@/lib/utils';

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
  const remainingColor = pool.remaining === 0 ? '' : '';

  const statusText =
    pool.remaining === 0
      ? 'All points allocated!'
      : `${pool.remaining} points remaining`;

  return (
    <div
      className={cssClasses(
        'component-point-pool-display',
        pool.remaining === 0 ? '' : ''
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div>
        <div>
          <span>{label}</span>
          <div>
            <span>
              Total: <span>{pool.total}</span>
            </span>
            <span className={`${remainingColor}`}>
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
      {/* Visually hidden status for screen readers */}
      <span>{statusText}</span>
    </div>
  );
};
