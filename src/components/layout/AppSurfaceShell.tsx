'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { HeaderNavigation } from '@/components/Navigation';
import { StorageFallbackBanner } from '@/components/shared/StorageFallbackBanner';
import { getSurfaceMode, getSurfaceRegister } from '@/lib/routing/surfaceMode';

interface AppSurfaceShellProps {
  children: React.ReactNode;
}

/**
 * AppSurfaceShell - two surfaces (#1655). The app surface carries one header,
 * a conditional breadcrumb band, and a centered content column; the manuscript
 * surface (play) carries no chrome at all.
 *
 * The app surface additionally carries a register, brand or product, which
 * _register-brand.css reads to retint the marketing routes. Same chrome and
 * geometry either way, so the register is a token layer, not a third surface.
 */
export function AppSurfaceShell({ children }: AppSurfaceShellProps) {
  const pathname = usePathname() || '/';

  if (getSurfaceMode(pathname) === 'manuscript') {
    return (
      <div className="app-surface app-surface-manuscript" data-surface-mode="manuscript">
        <StorageFallbackBanner />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div
      className="app-surface app-surface-app"
      data-surface-mode="app"
      data-register={getSurfaceRegister(pathname)}
    >
      <HeaderNavigation />
      <StorageFallbackBanner />
      <main id="main-content" tabIndex={-1} className="app-surface-main">
        <div className="app-surface-inner">{children}</div>
      </main>
    </div>
  );
}
