'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';

interface GameSessionSkeletonProps {
  className?: string;
}

export const GameSessionSkeleton: React.FC<GameSessionSkeletonProps> = ({
  className = ''
}) => {
  return (
    <div data-testid="game-session-skeleton" className={`flex-1 min-h-0 flex flex-col ${className}`}>
      {/* Two-column layout matching ActiveGameSession */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch flex-1 min-h-0">
        {/* Narrative Column Skeleton */}
        <div className="lg:flex-1 min-h-0 overflow-auto">
          <div className="space-y-4 p-4">
            {/* Narrative segments skeleton */}
            <div className="space-y-6">
              {/* First narrative segment */}
              <div className="space-y-3">
                <LoadingSkeleton
                  skeletonLines={4}
                  size="md"
                  theme="light"
                  centered={false}
                />
              </div>

              {/* Second narrative segment */}
              <div className="space-y-3">
                <LoadingSkeleton
                  skeletonLines={3}
                  size="md"
                  theme="light"
                  centered={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Choices Column Skeleton */}
        <div className="lg:flex-1 min-h-0 overflow-auto">
          <div className="space-y-4 p-4">
            {/* Choice buttons skeleton */}
            <div className="space-y-3">
              {/* Choice prompt skeleton */}
              <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse" />

              {/* Choice buttons */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 border border-gray-300 rounded-lg animate-pulse"
                />
              ))}

              {/* Custom input skeleton */}
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
                <div className="h-10 bg-gray-200 border border-gray-300 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
