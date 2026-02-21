'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { TutorialMenu } from './TutorialMenu';
import dynamic from 'next/dynamic';

const RecentPagesDropdown = dynamic(
  () =>
    import('./RecentPagesDropdown').then((m) => ({
      default: m.RecentPagesDropdown,
    })),
  { ssr: false }
);
import { useNavigationData } from './useNavigationData';
import { Globe, Users, Settings, Check, Play, Plus, Home } from 'lucide-react';
import { getGenreLabel } from '@/lib/constants/genres';
import type { Character } from '@/state/characterStore';

interface SidebarNavigationProps {
  onNavigate?: () => void;
}

/**
 * SidebarNavigation - Workshop navigation rail for world/character/settings routes.
 */
export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const {
    currentWorldId,
    worlds,
    characters,
    currentWorld,
    hasWorldsStore,
    navigateWithLoading,
    setCurrentWorld,
  } = useNavigationData();
  const [mounted, setMounted] = useState(false);
  const hasWorlds = mounted && hasWorldsStore;
  const activeWorld = mounted ? currentWorld : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigate = (path: string, message: string) => {
    navigateWithLoading(path, message);
    onNavigate?.();
  };

  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/worlds/${worldId}`, `Loading ${worldName}...`);
    onNavigate?.();
  };

  return (
    <nav aria-label="Workshop navigation" className="workshop-sidebar-nav">
      <div className="workshop-sidebar-header">
        <Link href="/" onClick={() => onNavigate?.()} className="workshop-sidebar-brand">
          <LogoIcon size="small" className="brightness-0" />
          <LogoText size="sm" />
        </Link>
        <TutorialMenu />
      </div>

      <div className="workshop-sidebar-section">
        <Button
          variant="ghost"
          className="workshop-nav-link"
          onClick={() => navigate('/worlds', 'Loading worlds...')}
        >
          <Globe aria-hidden="true" />
          Worlds
        </Button>
        <Button
          variant="ghost"
          className="workshop-nav-link"
          onClick={() => navigate('/characters', 'Loading characters...')}
        >
          <Users aria-hidden="true" />
          Characters
        </Button>
        <Button
          variant="ghost"
          className="workshop-nav-link"
          onClick={() => navigate('/settings', 'Loading settings...')}
        >
          <Settings aria-hidden="true" />
          Settings
        </Button>
      </div>

      {hasWorlds && (
        <div className="workshop-sidebar-section">
          <p className="workshop-sidebar-label">World Switcher</p>
          <div className="workshop-world-list">
            {Object.values(worlds).map((world) => {
              const worldCharacters = (
                Object.values(characters) as Character[]
              ).filter((char) => char.worldId === world.id).length;

              return (
                <Button
                  key={world.id}
                  variant="ghost"
                  className="workshop-world-button"
                  onClick={() => handleWorldSwitch(world.id)}
                >
                  <div>
                    <div>{world.name}</div>
                    <div>
                      {getGenreLabel(world.genre)} • {worldCharacters} characters
                    </div>
                  </div>
                  {world.id === currentWorldId && (
                    <Check aria-hidden="true" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="workshop-sidebar-section workshop-sidebar-section-grow">
        <RecentPagesDropdown />
      </div>

      <div className="workshop-sidebar-section">
        {activeWorld ? (
          <Button
            type="button"
            variant="success"
            className="workshop-primary-action"
            onClick={() =>
              navigate(
                `/worlds/${activeWorld.id}/play`,
                `Starting ${activeWorld.name}...`
              )
            }
          >
            <Play aria-hidden="true" />
            Play
          </Button>
        ) : mounted && !hasWorldsStore ? (
          <Button
            type="button"
            className="workshop-primary-action"
            onClick={() =>
              navigate('/worlds/create', 'Setting up world creation...')
            }
          >
            <Plus aria-hidden="true" />
            Create Your First World
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="workshop-primary-action"
            onClick={() => navigate('/worlds', 'Loading worlds...')}
          >
            <Home aria-hidden="true" />
            Browse Worlds
          </Button>
        )}
      </div>
    </nav>
  );
}
