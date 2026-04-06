'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { TutorialMenu } from './TutorialMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';
import { X, Menu, Globe, ChevronDown, Check, Plus, Play } from 'lucide-react';
import {
  headerDropdownDividerClass,
  headerDropdownItemClass,
  headerDropdownMenuClass,
  headerDropdownTriggerClass,
} from './navigationDropdownStyles';
import { useNavigationData } from './useNavigationData';
import type { Character } from '@/state/characterStore';

const RecentPagesDropdown = dynamic(
  () =>
    import('./RecentPagesDropdown').then((m) => ({
      default: m.RecentPagesDropdown,
    })),
  { ssr: false }
);

/**
 * HeaderNavigation - Default top navigation for non-workshop routes.
 */
export function HeaderNavigation() {
  const {
    pathname,
    currentWorldId,
    worlds,
    characters,
    currentWorld,
    hasWorldsStore,
    worldCharacterCount,
    navigateWithLoading,
    setCurrentWorld,
  } = useNavigationData();
  const { isMenuOpen, isMobile, closeMenu, toggleMenu } = useMobileNavigation();
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const hasWorlds = mounted && hasWorldsStore;
  const shouldShowBreadcrumbs = pathname !== '/' && pathname !== '/worlds';

  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        action: () => {
          if (showWorldSwitcher) {
            setShowWorldSwitcher(false);
          }
          if (isMenuOpen) {
            closeMenu();
          }
        },
        description: 'Close open menus and dropdowns',
      },
    ],
    true
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowWorldSwitcher(false);
      }
    };

    if (showWorldSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWorldSwitcher]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    setShowWorldSwitcher(false);
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/worlds/${worldId}`, `Loading ${worldName}...`);
  };

  if (pathname.startsWith('/dev')) {
    return null;
  }

  return (
    <>
      <header className="header-nav" role="banner">
        <nav role="navigation" aria-label="Main">
          <div className="header-nav-inner">
            <div className="header-nav-left">
              <div className="header-nav-links">
                {isMobile && (
                  <Button
                    onClick={toggleMenu}
                    variant="ghost"
                    size="icon"
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMenuOpen}
                  >
                    {isMenuOpen ? (
                      <X aria-hidden="true" />
                    ) : (
                      <Menu aria-hidden="true" />
                    )}
                  </Button>
                )}

                <Link href="/">
                  <LogoIcon size="small" className="brightness-0" />
                  <LogoText size="sm" />
                </Link>

                <div data-testid="desktop-navigation">
                  <Link href="/worlds" data-navigation>
                    Worlds
                  </Link>
                  <Link
                    href="/characters"
                    data-navigation
                    aria-disabled={!hasWorlds}
                  >
                    Characters
                  </Link>
                  <Link href="/settings" data-navigation>
                    Settings
                  </Link>
                </div>
              </div>

              <div className="header-nav-actions">
                <ThemeSwitcher />
                <DarkModeToggle />
                <TutorialMenu />
                {hasWorlds && (
                  <div ref={dropdownRef}>
                    <Button
                      onClick={() => setShowWorldSwitcher(!showWorldSwitcher)}
                      variant="ghost"
                      className={headerDropdownTriggerClass}
                    >
                      <Globe aria-hidden="true" />
                      <span>
                        {currentWorld ? currentWorld.name : 'Select World'}
                      </span>
                      {currentWorld && worldCharacterCount > 0 && (
                        <span>{worldCharacterCount}</span>
                      )}
                      <ChevronDown aria-hidden="true" />
                    </Button>

                    {showWorldSwitcher && (
                      <div className={headerDropdownMenuClass}>
                        {Object.values(worlds).map((world) => {
                          const worldCharacters = (
                            Object.values(characters) as Character[]
                          ).filter((char) => char.worldId === world.id).length;

                          return (
                            <Button
                              key={world.id}
                              onClick={() => handleWorldSwitch(world.id)}
                              variant="ghost"
                              className={headerDropdownItemClass}
                            >
                              <div>
                                <div>{world.name}</div>
                                <div>
                                  {getGenreLabel(world.genre)} •{' '}
                                  {worldCharacters} characters
                                </div>
                              </div>
                              {world.id === currentWorldId && (
                                <Check aria-hidden="true" />
                              )}
                            </Button>
                          );
                        })}

                        <div className={headerDropdownDividerClass}>
                          <Link
                            href="/worlds"
                            className={headerDropdownItemClass}
                            onClick={() => setShowWorldSwitcher(false)}
                          >
                            <Plus aria-hidden="true" />
                            Create a world
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <SSRClientOnly>
                  <RecentPagesDropdown />
                </SSRClientOnly>

                <SSRClientOnly>
                  {currentWorld ? (
                    <Button
                      type="button"
                      onClick={() =>
                        navigateWithLoading(
                          `/worlds/${currentWorld.id}/play`,
                          `Starting ${currentWorld.name}...`
                        )
                      }
                      variant="success"
                    >
                      <Play aria-hidden="true" />
                      Play
                    </Button>
                  ) : !hasWorldsStore ? (
                    <Button
                      type="button"
                      onClick={() =>
                        navigateWithLoading(
                          '/worlds/create',
                          'Setting up world creation...'
                        )
                      }
                    >
                      Create Your First World
                    </Button>
                  ) : null}
                </SSRClientOnly>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <MobileNavigationMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNavigate={navigateWithLoading}
      />

      {shouldShowBreadcrumbs && (
        <div className="breadcrumbs-container">
          <div className="breadcrumbs-inner">
            <SSRClientOnly>
              <Breadcrumbs maxItems={2} className="breadcrumbs-mobile" />
            </SSRClientOnly>
            <SSRClientOnly>
              <Breadcrumbs className="breadcrumbs-desktop" />
            </SSRClientOnly>
          </div>
        </div>
      )}
    </>
  );
}
