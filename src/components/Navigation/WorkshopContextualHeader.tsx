'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Menu, X, Play, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
import { Breadcrumbs } from './Breadcrumbs';
import { TutorialMenu } from './TutorialMenu';
import { useNavigationData } from './useNavigationData';

const RecentPagesDropdown = dynamic(
  () =>
    import('./RecentPagesDropdown').then((m) => ({
      default: m.RecentPagesDropdown,
    })),
  { ssr: false }
);

interface WorkshopContextualHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * WorkshopContextualHeader - top chrome of the workshop workspace.
 * Desktop: breadcrumb + recent pages + tutorial + contextual CTA.
 * Mobile: hamburger + workshop title + contextual CTA.
 */
export function WorkshopContextualHeader({
  sidebarOpen,
  onToggleSidebar,
}: WorkshopContextualHeaderProps) {
  const {
    currentWorld,
    hasWorldsStore,
    navigateWithLoading,
  } = useNavigationData();

  const cta = currentWorld ? (
    <Button
      type="button"
      variant="success"
      className="workshop-context-header-cta"
      onClick={() =>
        navigateWithLoading(
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
      className="workshop-context-header-cta"
      onClick={() =>
        navigateWithLoading('/worlds/create', 'Setting up world creation...')
      }
    >
      <Plus aria-hidden="true" />
      Create Your First World
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      className="workshop-context-header-cta"
      onClick={() => navigateWithLoading('/worlds', 'Loading worlds...')}
    >
      <Home aria-hidden="true" />
      Browse Worlds
    </Button>
  );

  return (
    <header className="workshop-context-header" data-identifier="workshop-context-header">
      <div className="workshop-context-header-left">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
          className="workshop-context-header-mobile-trigger"
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
        <p className="workshop-context-header-mobile-title">Workshop</p>
        <SSRClientOnly>
          <Breadcrumbs className="workshop-context-header-breadcrumbs" />
        </SSRClientOnly>
      </div>
      <div className="workshop-context-header-right">
        <TutorialMenu />
        <SSRClientOnly>
          <RecentPagesDropdown className="workshop-context-header-recent" />
        </SSRClientOnly>
        {/* SSR-defer the CTA: without it the button flickers between server-rendered "Browse Worlds" and the hydrated "Play" once the world store loads. */}
        <SSRClientOnly>{cta}</SSRClientOnly>
      </div>
    </header>
  );
}
