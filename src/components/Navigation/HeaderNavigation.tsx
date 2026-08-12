'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { TutorialMenu } from './TutorialMenu';
import { ThemeMenu } from './ThemeMenu';
import { WorldSwitcher } from './WorldSwitcher';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { X, Menu, Plus, Play } from 'lucide-react';
import { useNavigationData } from './useNavigationData';
import { getSurfaceRegister } from '@/lib/routing/surfaceMode';

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
    currentWorld,
    hasWorldsStore,
    navigateWithLoading,
  } = useNavigationData();
  const { isMenuOpen, closeMenu, toggleMenu } = useMobileNavigation();
  const [mounted, setMounted] = useState(false);

  const hasWorlds = mounted && hasWorldsStore;
  const isProductRegister = getSurfaceRegister(pathname) === 'product';
  const shouldShowBreadcrumbs =
    isProductRegister && !BREADCRUMB_SUPPRESSED_ROUTES.has(pathname);
  // The band carries the story-level context — where you are, and which world
  // you're in. Either one alone earns it; neither means no band at all, since
  // it has its own border and an empty one reads as an artifact.
  const shouldShowContextBand =
    isProductRegister && (shouldShowBreadcrumbs || hasWorlds);
  // Public context (no local worlds yet) brands to the landing page at /;
  // once this browser has app state, the brand is a home link to /dashboard
  // so app users aren't sent back to the marketing front door (#1528).
  const brandHref = hasWorlds ? '/dashboard' : '/';

  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        action: () => {
          if (isMenuOpen) {
            closeMenu();
          }
        },
        description: 'Close the navigation drawer',
      },
    ],
    true
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Brand routes suppress the header CTA wholesale rather than joining the
  // regex list above: every brand page either owns its own primary CTA
  // (about's closing band) or intentionally has none (privacy, terms), so a
  // per-path entry here would rot the moment a brand sub-route lands — same
  // reasoning BREADCRUMB_SUPPRESSED_ROUTES already applies.
  const suppressCta =
    !isProductRegister ||
    CTA_SUPPRESSED_ROUTES.some((route) => route.test(pathname));

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
          {/* Both edges are anchored by an element whose ink sits on the content
              gutter: the logo at the leading edge, and a control box at the
              trailing edge, matching how the page below aligns text left and
              button boxes right. */}
          <div className="header-nav-inner">
            {/* The wordmark and the section links are one run of type, so they
                share a baseline rather than each being centred on its own box. */}
            <div className="header-nav-sections">
              <Link href={brandHref} className="app-brand">
                <LogoIcon size="small" />
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

              <SSRClientOnly className="header-nav-cta">
                {cta && (
                  <>
                    <span className="header-nav-divider" aria-hidden="true" />
                    {cta}
                  </>
                )}
              </SSRClientOnly>
            </div>

            {/* Always rendered; CSS (not JS matchMedia) gates visibility to
                <=768px, so the collapse has a single source of truth and can't
                desync the layout (#1381). Last in the row so its box lands on
                the trailing gutter where the drawer's own close control sits. */}
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
          </div>
        </nav>
      </header>

      <MobileNavigationMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNavigate={navigateWithLoading}
      />

      {shouldShowContextBand && (
        <div className="context-band">
          <div className="context-band-inner">
            <div className="context-band-path">
              {shouldShowBreadcrumbs && (
                <>
                  <SSRClientOnly>
                    <Breadcrumbs maxItems={2} className="breadcrumbs-mobile" />
                  </SSRClientOnly>
                  <SSRClientOnly>
                    <Breadcrumbs className="breadcrumbs-desktop" />
                  </SSRClientOnly>
                </>
              )}
            </div>

            {hasWorlds && <WorldSwitcher />}
          </div>
        </div>
      )}
    </>
  );
}
