'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { useWorldStore } from '@/state/worldStore';
import { plateInkStyle, usePlate } from '@/hooks/usePlate';

interface WorldThumbnailProps {
  url?: string | null;
  name: string;
}

/** Thumbnail edge for continuous-tone ink plate. */
const THUMBNAIL_PX = 96;
const THUMBNAIL_BOX = { width: THUMBNAIL_PX, height: THUMBNAIL_PX };

function initialOf(name: string): string {
  return (Array.from(name)[0] ?? '').toUpperCase();
}

function WorldThumbnail({ url, name }: WorldThumbnailProps) {
  const { plate, pending } = usePlate(url ?? undefined, THUMBNAIL_BOX);

  return (
    <span
      className={clsx('dashboard-recent-world-thumb', plate && 'plate-inked')}
      style={plateInkStyle(plate)}
      data-plate={pending ? 'pending' : undefined}
      aria-hidden="true"
    >
      {url ? (
        <Image
          src={plate?.source ?? url}
          alt=""
          width={THUMBNAIL_PX}
          height={THUMBNAIL_PX}
          unoptimized
        />
      ) : (
        <span className="world-card-plate-initial">
          {initialOf(name)}
        </span>
      )}
    </span>
  );
}

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
      <section
        className="component-dashboard-recent-worlds"
        aria-labelledby="recent-worlds-heading"
      >
        <h2 id="recent-worlds-heading">Recent Worlds</h2>
        <div className="dashboard-recent-empty-state">
          <p>No worlds yet</p>
          <Button onClick={() => onNavigate('/worlds')} variant="secondary">
            <Plus aria-hidden="true" />
            Create Your First World
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="component-dashboard-recent-worlds"
      aria-labelledby="recent-worlds-heading"
    >
      <h2 id="recent-worlds-heading">Recent Worlds</h2>

      <div className="dashboard-recent-list">
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
            <div className="dashboard-recent-world-content">
              <WorldThumbnail url={world.image?.url} name={world.name} />
              <div className="dashboard-recent-item-meta">
                <h3>{world.name}</h3>
                <p>{getGenreLabel(world.genre)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, index) => (
            <Button
              key={`empty-${index}`}
              onClick={() => onNavigate('/worlds')}
              variant="ghost"
              size="sm"
              className="dashboard-recent-empty-slot"
            >
              <Plus aria-hidden="true" />
              Create World
            </Button>
          ))}
      </div>
    </section>
  );
}
