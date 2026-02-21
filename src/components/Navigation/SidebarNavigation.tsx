'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { TutorialMenu } from './TutorialMenu';
import { RecentPagesDropdown } from './RecentPagesDropdown';
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

      {hasWorldsStore && (
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
        <RecentPagesDropdown className="workshop-recent-pages" />
      </div>

      <div className="workshop-sidebar-section">
        {currentWorld ? (
          <Button
            type="button"
            variant="success"
            className="workshop-primary-action"
            onClick={() =>
              navigate(
                `/worlds/${currentWorld.id}/play`,
                `Starting ${currentWorld.name}...`
              )
            }
          >
            <Play aria-hidden="true" />
            Play
          </Button>
        ) : !hasWorldsStore ? (
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
