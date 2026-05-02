'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogoIcon, LogoText } from '@/components/ui/Logo';
import { TutorialMenu } from './TutorialMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { useNavigationData } from './useNavigationData';
import { Check } from 'lucide-react';
import { getGenreLabel } from '@/lib/constants/genres';
import type { Character } from '@/state/characterStore';

interface SidebarNavigationProps {
  onNavigate?: () => void;
}

const PRIMARY_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  loadingMessage: string;
}> = [
  { href: '/worlds', label: 'Worlds', loadingMessage: 'Loading worlds...' },
  { href: '/characters', label: 'Characters', loadingMessage: 'Loading characters...' },
  { href: '/settings', label: 'Settings', loadingMessage: 'Loading settings...' },
];

/**
 * SidebarNavigation - Workshop navigation rail (desktop ≥768) and drawer (mobile).
 * Desktop: typographic primary list, embedded world switcher, horizontal bottom toolbar.
 * The contextual CTA, recent pages, and breadcrumbs live in WorkshopContextualHeader.
 */
export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const {
    pathname,
    currentWorldId,
    worlds,
    characters,
    hasWorldsStore,
    navigateWithLoading,
    setCurrentWorld,
  } = useNavigationData();
  // useNavigationData.pathname can lag during route transitions; usePathname() is the live-tick value used for active-link styling.
  const livePath = usePathname() ?? pathname;
  const [mounted, setMounted] = useState(false);
  const hasWorlds = mounted && hasWorldsStore;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPrimaryActive = (href: string) =>
    livePath === href || livePath.startsWith(`${href}/`);

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
    <nav
      aria-label="Workshop navigation"
      className="workshop-sidebar-nav"
      data-identifier="workshop-sidebar-nav"
    >
      <div className="workshop-sidebar-brand-row">
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="workshop-sidebar-brand"
        >
          <LogoIcon size="small" className="logo-icon-inverted" />
          <LogoText size="sm" />
        </Link>
      </div>

      <ul className="workshop-sidebar-primary">
        {PRIMARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isPrimaryActive(link.href) ? 'page' : undefined}
              data-active={isPrimaryActive(link.href) ? 'true' : undefined}
              className="workshop-sidebar-primary-link"
              onClick={(e) => {
                // Let modifier clicks (cmd/ctrl/shift) and non-primary buttons fall through to native <Link> so the browser can open a new tab/window.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navigate(link.href, link.loadingMessage);
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {hasWorlds && (
        <section
          className="workshop-sidebar-worlds-section"
          aria-label="World switcher"
        >
          <p className="workshop-sidebar-section-label">Worlds</p>
          <ul className="workshop-sidebar-worlds-list">
            {Object.values(worlds).map((world) => {
              const worldCharacters = (
                Object.values(characters) as Character[]
              ).filter((char) => char.worldId === world.id).length;
              const isActive = world.id === currentWorldId;

              return (
                <li key={world.id}>
                  <Button
                    variant="ghost"
                    className="workshop-sidebar-world-item"
                    data-active={isActive ? 'true' : undefined}
                    onClick={() => handleWorldSwitch(world.id)}
                  >
                    <span className="workshop-sidebar-world-name">
                      {world.name}
                    </span>
                    <span className="workshop-sidebar-world-meta">
                      {getGenreLabel(world.genre)} · {worldCharacters} characters
                    </span>
                    {isActive && <Check aria-hidden="true" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="workshop-sidebar-spacer" aria-hidden="true" />

      <div className="workshop-sidebar-toolbar">
        <ThemeSwitcher compact />
        <DarkModeToggle compact />
        <TutorialMenu />
      </div>
    </nav>
  );
}
