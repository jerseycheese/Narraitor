'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';
import { GAME_SESSION_STABLE_COLUMN_HEIGHT } from './layoutStability';

interface GameSessionSkeletonProps {
  className?: string;
}

export const GameSessionSkeleton: React.FC<GameSessionSkeletonProps> = ({
  className = '',
}) => {
  const stableColumnStyle: React.CSSProperties = {
    height: GAME_SESSION_STABLE_COLUMN_HEIGHT,
    maxHeight: GAME_SESSION_STABLE_COLUMN_HEIGHT,
    overflow: 'hidden',
  };

  return (
    <div data-testid="game-session-skeleton" className={`${className}`}>
      {/* Two-column layout matching ActiveGameSession */}
      <div>
        {/* Narrative Column Skeleton */}
        <div
          data-testid="game-session-skeleton-narrative-column"
          style={stableColumnStyle}
        >
          <div>
            {/* Narrative segments skeleton */}
            <div>
              {/* First narrative segment */}
              <div>
                <LoadingSkeleton
                  skeletonLines={4}
                  size="md"
                  theme="light"
                  centered={false}
                />
              </div>

              {/* Second narrative segment */}
              <div>
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
        <div
          data-testid="game-session-skeleton-choices-column"
          style={stableColumnStyle}
        >
          <div>
            {/* Choice buttons skeleton */}
            <div>
              {/* Choice prompt skeleton */}
              <div />

              {/* Choice buttons */}
              {[1, 2, 3].map((i) => (
                <div key={i} />
              ))}

              {/* Custom input skeleton */}
              <div>
                <div />
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
