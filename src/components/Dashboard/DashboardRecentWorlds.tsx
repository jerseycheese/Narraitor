'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { useWorldStore } from '@/state/worldStore';

interface DashboardRecentWorldsProps {
  worlds: ReturnType<typeof useWorldStore.getState>['worlds'];
  maxItems: number;
  onNavigate: (path: string) => void;
}

export function DashboardRecentWorlds({
  worlds,
  maxItems,
  onNavigate,
}: DashboardRecentWorldsProps) {
  const recentWorlds = useMemo(() => {
    return Object.values(worlds)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, maxItems);
  }, [worlds, maxItems]);

  const emptySlots = maxItems - recentWorlds.length;

  if (recentWorlds.length === 0) {
    return (
      <section className="component-dashboard-recent-worlds">
        <h2>Recent Worlds</h2>
        <div>
          <p>No worlds yet</p>
          <Button onClick={() => onNavigate('/worlds')} variant="default">
            <Plus aria-hidden="true" />
            Create Your First World
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="component-dashboard-recent-worlds">
      <h2>Recent Worlds</h2>

      <div>
        {/* Recent Worlds */}
        {recentWorlds.map((world) => (
          <div
            key={world.id}
            className="dashboard-recent-item"
            onClick={() => onNavigate(`/worlds/${world.id}`)}
            role="button"
            tabIndex={0}
            aria-label={`View world: ${world.name}, genre: ${getGenreLabel(world.genre)}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate(`/worlds/${world.id}`);
              }
            }}
          >
            <h3>{world.name}</h3>
            <div>
              <span>{getGenreLabel(world.genre)}</span>
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, index) => (
            <div key={`empty-${index}`}>
              <Button
                onClick={() => onNavigate('/worlds')}
                variant="ghost"
                size="sm"
              >
                <Plus aria-hidden="true" />
                Create World
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
}
