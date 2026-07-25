'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';
import { clsx } from 'clsx';

interface GameSessionSkeletonProps {
  className?: string;
}

export const GameSessionSkeleton: React.FC<GameSessionSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      data-testid="game-session-skeleton"
      className={clsx("manuscript-skeleton-viewport", className)}
    >
      {/* Floating HUD Skeleton */}
      <div className="manuscript-skeleton-header">
        <div className="manuscript-skeleton-avatar manuscript-skeleton-pulse" />
        <div className="manuscript-skeleton-avatar manuscript-skeleton-pulse" />
      </div>

      {/* Main Narrative Stage Skeleton */}
      <main className="manuscript-skeleton-body">
        <div className="manuscript-skeleton-content">
          <div className="manuscript-skeleton-paragraph">
            <LoadingSkeleton
              skeletonLines={6}
            />
          </div>
          <div className="manuscript-skeleton-paragraph">
            <LoadingSkeleton
              skeletonLines={4}
            />
          </div>
        </div>
      </main>

      {/* Docked Action Rail Skeleton */}
      <div className="manuscript-skeleton-footer">
        <div className="manuscript-skeleton-footer-content">
          <div className="manuscript-skeleton-prompt manuscript-skeleton-pulse" />
          <div className="manuscript-skeleton-choice-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="manuscript-skeleton-choice manuscript-skeleton-pulse" />
            ))}
          </div>
          <div className="manuscript-skeleton-input manuscript-skeleton-pulse" />
        </div>
      </div>
    </div>
  );
};
