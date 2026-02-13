'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';
import { cssClasses } from '@/lib/utils';

interface GameSessionSkeletonProps {
  className?: string;
}

export const GameSessionSkeleton: React.FC<GameSessionSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div 
      data-testid="game-session-skeleton" 
      className={cssClasses("relative min-h-screen flex flex-col bg-background", className)}
    >
      {/* Floating HUD Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Main Narrative Stage Skeleton */}
      <main className="flex-grow flex flex-col items-center px-4 pt-20 pb-40">
        <div className="w-full max-w-3xl space-y-8">
          <div className="space-y-4">
            <LoadingSkeleton
              skeletonLines={6}
              size="md"
              theme="light"
              centered={false}
            />
          </div>
          <div className="space-y-4">
            <LoadingSkeleton
              skeletonLines={4}
              size="md"
              theme="light"
              centered={false}
            />
          </div>
        </div>
      </main>

      {/* Docked Action Rail Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-14 w-full bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );
};