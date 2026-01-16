'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { useWorldStore } from '@/state/worldStore';

interface DashboardRecentWorldsProps {
  worlds: ReturnType<typeof useWorldStore.getState>["worlds"];
  maxItems: number;
  onNavigate: (path: string) => void;
}

export function DashboardRecentWorlds({
  worlds,
  maxItems,
  onNavigate
}: DashboardRecentWorldsProps) {
  const recentWorlds = useMemo(() => {
    return Object.values(worlds)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, maxItems);
  }, [worlds, maxItems]);

  const emptySlots = maxItems - recentWorlds.length;

  if (recentWorlds.length === 0) {
    return (
      <section className="component-dashboard-recent-worlds bg-background rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Worlds</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No worlds yet</p>
          <Button onClick={() => onNavigate('/worlds')} variant="default">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Create Your First World
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="component-dashboard-recent-worlds bg-background rounded-lg border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Recent Worlds</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recent Worlds */}
        {recentWorlds.map((world) => (
          <div
            key={world.id}
            className="rounded-lg border p-4 hover:border-primary transition-colors cursor-pointer"
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
            <h3 className="font-semibold mb-2 truncate">{world.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                {getGenreLabel(world.genre)}
              </span>
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="rounded-lg border border-dashed p-4 flex items-center justify-center"
            >
              <Button
                onClick={() => onNavigate('/worlds')}
                variant="ghost"
                size="sm"
                className="w-full h-full"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Create World
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
}
