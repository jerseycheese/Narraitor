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
import { ThemeMenu } from './ThemeMenu';
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
import { getSurfaceRegister } from '@/lib/routing/surfaceMode';
import type { Character } from '@/state/characterStore';

const RecentPagesDropdown = dynamic(
  () =>
    import('./RecentPagesDropdown').then((m) => ({
      default: m.RecentPagesDropdown,
    })),
  { ssr: false }
);

// Routes that own the play/create action inline, where a header CTA would just
// duplicate it. Extends the suppression the retired workshop header applied to
// /worlds alone; this is the double-Play fix (#1655).
// Routes that own the play or create action inline. Their own control is the
// better one — the roster's Play sets the character before routing, where the
// header's only sets the world — and both land on the same play URL.
const CTA_SUPPRESSED_ROUTES: readonly RegExp[] = [
  /^\/worlds$/,
  /^\/worlds\/create$/,
  /^\/worlds\/[^/]+$/,
  /^\/worlds\/[^/]+\/edit$/,
  /^\/characters$/,
  /^\/characters\/create$/,
  /^\/characters\/[^/]+$/,
];

// Top-level product destinations orient on their own. Exact match, not a
// prefix, or /settings/providers and the detail routes lose the breadcrumbs
// they need. Brand routes aren't listed: the whole register is breadcrumb-free,
// so a per-path list here would rot the moment a brand sub-route lands.
const BREADCRUMB_SUPPRESSED_ROUTES = new Set([
  '/dashboard',
  '/worlds',
  '/characters',
  '/settings',
]);

/**
 * HeaderNavigation - the app surface's only chrome (#1655).
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
  const { isMenuOpen, closeMenu, toggleMenu } = useMobileNavigation();
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const hasWorlds = mounted && hasWorldsStore;
  const shouldShowBreadcrumbs =
    getSurfaceRegister(pathname) === 'product' &&
    !BREADCRUMB_SUPPRESSED_ROUTES.has(pathname);
  // Public context (no local worlds yet) brands to the landing page at /;
  // once this browser has app state, the brand is a home link to /dashboard
  // so app users aren't sent back to the marketing front door (#1528).
  const brandHref = hasWorlds ? '/dashboard' : '/';

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

  const suppressCta = CTA_SUPPRESSED_ROUTES.some((route) =>
    route.test(pathname)
  );

  const cta = suppressCta ? null : currentWorld ? (
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
        navigateWithLoading('/worlds/create', 'Setting up world creation...')
      }
    >
      <Plus aria-hidden="true" />
      Create Your First World
    </Button>
  ) : null;

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
                {/* Always rendered; CSS (not JS matchMedia) gates visibility to
                    <=768px, so the collapse has a single source of truth and can't
                    desync the layout (#1381). */}
                <div className="header-nav-mobile-toggle">
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
                </div>

                <Link href={brandHref} className="app-brand">
                  <LogoIcon size="small" className="logo-icon-inverted" />
                  <LogoText className="app-wordmark" />
                </Link>

                <div
                  className="header-nav-desktop-links"
                  data-testid="desktop-navigation"
                >
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
                <div className="header-nav-actions-group">
                  <ThemeMenu />
                  <TutorialMenu />
                  <SSRClientOnly>
                    <RecentPagesDropdown />
                  </SSRClientOnly>
                </div>

                {hasWorlds && (
                  <>
                    <span className="header-nav-divider" aria-hidden="true" />
                    <div ref={dropdownRef} className="header-nav-actions-group">
                      <Button
                        onClick={() => setShowWorldSwitcher(!showWorldSwitcher)}
                        variant="ghost"
                        className={`${headerDropdownTriggerClass} header-world-trigger${currentWorld ? ' header-world-trigger-active' : ''}`}
                      >
                        <Globe aria-hidden="true" />
                        <span className="header-world-name">
                          {currentWorld ? currentWorld.name : 'Select World'}
                        </span>
                        {currentWorld && worldCharacterCount > 0 && (
                          <span className="header-world-count">
                            {worldCharacterCount}{' '}
                            {worldCharacterCount === 1 ? 'character' : 'characters'}
                          </span>
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
                              href="/worlds/create"
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
                  </>
                )}

                <SSRClientOnly>
                  {cta && (
                    <>
                      <span
                        className="header-nav-divider"
                        aria-hidden="true"
                      />
                      {cta}
                    </>
                  )}
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
