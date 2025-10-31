import React from 'react';
import { CheckCircle } from 'lucide-react';

interface PointPool {
  total: number;
  spent: number;
  remaining: number;
}

interface PointPoolDisplayProps {
  pool: PointPool;
}

export const PointPoolDisplay: React.FC<PointPoolDisplayProps> = ({ pool }) => {
  const remainingColor =
    pool.remaining === 0
      ? 'text-green-500'
      : pool.remaining < 0
      ? 'text-red-500'
      : 'text-amber-500';

  return (
    <div className="component-point-pool-display flex items-center space-x-4 text-sm">
      <div className="flex items-center">
        <span className="text-gray-700 mr-2">Total:</span>
        <span className="font-semibold">{pool.total}</span>
      </div>
      <div className="flex items-center">
        <span className={`font-bold ${remainingColor}`}>
          Remaining: {pool.remaining}
        </span>
        {pool.remaining === 0 && (
          <CheckCircle className="w-4 h-4 ml-1 text-green-500" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};
