'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { TutorialMenu } from './TutorialMenu';
import { ThemeMenu } from './ThemeMenu';
import { X, Globe, User, Settings, Check, Play, Plus } from 'lucide-react';

const SWIPE_THRESHOLD = 100;

interface MobileNavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

/**
 * MobileNavigationMenu - Full-screen mobile navigation overlay
 *
 * Provides a touch-friendly navigation experience for mobile devices with:
 * - Full-screen overlay design
 * - Touch targets minimum 44px (accessibility compliant)
 * - Smooth animations and gestures
 * - Focus management and keyboard navigation
 * - World switcher and quick actions
 *
 * @param isOpen - Whether the mobile menu is currently open
 * @param onClose - Callback to close the menu
 * @param onNavigate - Callback for navigation with loading states
 */
export const MobileNavigationMenu = React.memo(function MobileNavigationMenu({
  isOpen,
  onClose,
  onNavigate,
}: MobileNavigationMenuProps) {
  const { currentWorldId, worlds, setCurrentWorld } = useWorldStore();
  const { characters } = useCharacterStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;

  // Focus management - focus first element when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector(
        'button'
      ) as HTMLButtonElement;
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  // Touch gesture handling for swipe to close (memoized)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startX.current || !startY.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = startX.current - currentX;
      const diffY = startY.current - currentY;

      // Only close on significant horizontal swipe (left to right)
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > SWIPE_THRESHOLD) {
        onClose();
      }
    },
    [onClose]
  );

  const handleTouchEnd = useCallback(() => {
    startX.current = 0;
    startY.current = 0;
  }, []);

  const handleNavigation = useCallback(
    (path: string) => {
      onNavigate(path);
      onClose();
    },
    [onNavigate, onClose]
  );

  const handleWorldSwitch = useCallback(
    (worldId: string) => {
      setCurrentWorld(worldId);
      onNavigate(`/worlds/${worldId}`);
      onClose();
    },
    [setCurrentWorld, onNavigate, onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="mobile-nav-menu"
      role="navigation"
      aria-label="Mobile navigation"
      ref={menuRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with close button */}
      <div className="mobile-nav-header">
        <div className="mobile-nav-brand">
          <LogoIcon size="small" className="logo-icon-inverted" />
          <LogoText className="app-wordmark" />
        </div>
        <div className="mobile-nav-header-actions">
          {/* Appearance + tutorial menus for mobile parity with the desktop header */}
          <ThemeMenu />
          <TutorialMenu />
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close menu"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main navigation items */}
      <div className="mobile-nav-links">
        <Button onClick={() => handleNavigation('/worlds')} variant="ghost">
          <Globe aria-hidden="true" />
          Worlds
        </Button>

        {/* Only show Characters nav when worlds exist */}
        {/* Always render Characters nav item to keep markup consistent between SSR and client */}
        <Button onClick={() => handleNavigation('/characters')} variant="ghost">
          <User aria-hidden="true" />
          Characters
        </Button>

        <Button onClick={() => handleNavigation('/settings')} variant="ghost">
          <Settings aria-hidden="true" />
          Settings
        </Button>

        {/* World switcher section */}
        {Object.keys(worlds).length > 0 && (
          <div className="mobile-nav-section">
            <h3 className="mobile-nav-section-title">Worlds</h3>
            <div className="mobile-nav-world-list">
              {Object.values(worlds).map((world) => {
                const worldCharacters = (
                  Object.values(characters) as Character[]
                ).filter((char) => char.worldId === world.id).length;

                return (
                  <Button
                    key={world.id}
                    onClick={() => handleWorldSwitch(world.id)}
                    variant="ghost"
                  >
                    <div>
                      <div>{world.name}</div>
                      <div>
                        {getGenreLabel(world.genre)} • {worldCharacters}{' '}
                        characters
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

        {/* Quick actions */}
        <div className="mobile-nav-actions">
          {currentWorld ? (
            <Button
              onClick={() =>
                handleNavigation(`/worlds/${currentWorld.id}/play`)
              }
              variant="success"
            >
              <Play aria-hidden="true" />
              Play {currentWorld.name}
            </Button>
          ) : Object.keys(worlds).length === 0 ? (
            <Button onClick={() => handleNavigation('/worlds/create')}>
              <Plus aria-hidden="true" />
              Create Your First World
            </Button>
          ) : (
            <Button onClick={() => handleNavigation('/worlds/create')}>
              <Plus aria-hidden="true" />
              Create New World
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
