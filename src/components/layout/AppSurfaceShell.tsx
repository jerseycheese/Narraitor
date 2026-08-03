'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { HeaderNavigation } from '@/components/Navigation';
import { getSurfaceMode } from '@/lib/routing/surfaceMode';

interface AppSurfaceShellProps {
  children: React.ReactNode;
}

/**
 * AppSurfaceShell - two surfaces (#1655). The app surface carries one header,
 * a conditional breadcrumb band, and a centered content column; the manuscript
 * surface (play) carries no chrome at all.
 */
export function AppSurfaceShell({ children }: AppSurfaceShellProps) {
  const pathname = usePathname();

  if (getSurfaceMode(pathname || '/') === 'manuscript') {
    return (
      <div className="app-surface app-surface-manuscript" data-surface-mode="manuscript">
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-surface app-surface-app" data-surface-mode="app">
      <HeaderNavigation />
      <main id="main-content" tabIndex={-1} className="app-surface-main">
        <div className="app-surface-inner">{children}</div>
      </main>
    </div>
  );
}
