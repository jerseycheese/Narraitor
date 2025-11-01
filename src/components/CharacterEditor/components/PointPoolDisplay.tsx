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
  label = 'Point Pool'
}) => {
  const remainingColor =
    pool.remaining === 0 ? 'text-green-500' : 'text-amber-500';

  const statusText =
    pool.remaining === 0
      ? 'All points allocated!'
      : `${pool.remaining} points remaining`;

  return (
    <div
      className="component-point-pool-display bg-gray-100 rounded-lg p-3 border transition-colors duration-300"
      style={pool.remaining === 0 ? { backgroundColor: 'rgb(240 253 244)', borderColor: 'rgb(134 239 172)' } : undefined}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-600">
            {label}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Total: <span className="font-semibold">{pool.total}</span>
            </span>
            <span className={`text-sm font-bold ${remainingColor}`}>
              Remaining: {pool.remaining}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          {pool.remaining === 0 && (
            <span className="flex items-center gap-2 text-green-700 text-xs font-medium">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              All allocated!
            </span>
          )}
        </div>
      </div>
      {/* Visually hidden status for screen readers */}
      <span className="sr-only">{statusText}</span>
    </div>
  );
};
