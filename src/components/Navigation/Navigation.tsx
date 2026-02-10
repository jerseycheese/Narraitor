'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Breadcrumbs } from './Breadcrumbs';
import dynamic from 'next/dynamic';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
// Render RecentPagesDropdown only on the client to avoid SSR/client mismatches
const RecentPagesDropdown = dynamic(
  () =>
    import('./RecentPagesDropdown').then((m) => ({
      default: m.RecentPagesDropdown,
    })),
  { ssr: false }
);
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { TutorialMenu } from './TutorialMenu';
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

/**
 * Navigation - Main application navigation component
 *
 * Provides the primary navigation bar with logo, main navigation links,
 * world switcher dropdown, and contextual action buttons. Automatically
 * adapts based on current route and available worlds/characters.
 *
 * Features:
 * - Responsive design with mobile-friendly layout
 * - World switcher dropdown with character counts
 * - Contextual play button when world is selected
 * - Breadcrumb navigation for deeper pages
 * - Automatic current world and character tracking
 *
 * @returns The main navigation component with header and breadcrumbs
 *
 * @example
 * // Used in root layout - no props needed
 * <Navigation />
 */
export function Navigation() {
  const pathname = usePathname();
  const { currentWorldId, worlds, setCurrentWorld } = useWorldStore();
  const { characters } = useCharacterStore();
  const { navigateWithLoading } = useNavigationLoadingContext();
  const { isMenuOpen, isMobile, closeMenu, toggleMenu } = useMobileNavigation();
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const currentWorld = currentWorldId ? worlds[currentWorldId] : null;  const hasWorldsStore = Object.keys(worlds).length > 0;
  const worldCharacterCount = (Object.values(characters) as Character[]).filter(
    (char) => char.worldId === currentWorldId
  ).length;
  // Ensure first client render matches server by deferring store-driven visibility until after mount
  const hasWorlds = mounted && hasWorldsStore;

  // Check if we should show breadcrumbs
  const shouldShowBreadcrumbs = pathname !== '/' && pathname !== '/worlds';

  // Keyboard shortcuts for navigation
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

  // Close dropdown when clicking outside
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

  // Mark mounted after first client render
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWorldSwitch = (worldId: string) => {
    setCurrentWorld(worldId);
    setShowWorldSwitcher(false);
    // Navigate to the selected world's view page with loading state
    const worldName = worlds[worldId]?.name || 'world';
    navigateWithLoading(`/worlds/${worldId}`, `Loading ${worldName}...`);
  };

  // Don't show navigation on dev pages
  if (pathname.startsWith('/dev')) {
    return null;
  }

  return (
    <>
      <header role="banner">
        <nav role="navigation" aria-label="Main">
          <div>
            <div>
              {/* Left side - Logo and mobile menu button */}
              <div>
                {/* Mobile menu button */}
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

                {/* Desktop navigation */}
                <div data-testid="desktop-navigation">
                  <Link href="/worlds" data-navigation>
                    Worlds
                  </Link>
                  {/* Always render Characters link to keep server/client markup consistent */}
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

              {/* Right side - Quick actions and current context (hidden on mobile) */}
              <div>
                <TutorialMenu />
                {/* World Switcher Dropdown */}
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
                      <div className={`${headerDropdownMenuClass}`}>
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
                            className={`${headerDropdownItemClass}`}
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

                {/* Recent Pages Dropdown - mount after SSR-matched elements to avoid hydration diff */}
                <SSRClientOnly>
                  <RecentPagesDropdown />
                </SSRClientOnly>

                {/* Quick actions - render after hydration to keep SSR stable */}
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

      {/* Mobile Navigation Menu */}
      <MobileNavigationMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNavigate={navigateWithLoading}
      />

      {/* Breadcrumbs - render after hydration to keep SSR/client markup identical */}
      {shouldShowBreadcrumbs && (
        <div>
          <div>
            <SSRClientOnly>
              <Breadcrumbs maxItems={2} />
            </SSRClientOnly>
            <SSRClientOnly>
              <Breadcrumbs />
            </SSRClientOnly>
          </div>
        </div>
      )}
    </>
  );
}
