'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  HeaderNavigation,
  SidebarNavigation,
  WorkshopContextualHeader,
} from '@/components/Navigation';
import { getSurfaceMode } from '@/lib/routing/surfaceMode';

interface AppSurfaceShellProps {
  children: React.ReactNode;
}

/**
 * AppSurfaceShell - Route-aware shell that switches between default and workshop layouts.
 */
export function AppSurfaceShell({ children }: AppSurfaceShellProps) {
  const pathname = usePathname();
  const surfaceMode = getSurfaceMode(pathname || '/');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (surfaceMode === 'default') {
    return (
      <div className="app-surface app-surface-default" data-surface-mode="default">
        <HeaderNavigation />
        <main id="main-content" tabIndex={-1} className="default-surface-main">
          <div className="default-surface-inner">{children}</div>
        </main>
      </div>
    );
  }

  if (surfaceMode === 'manuscript') {
    return (
      <div className="app-surface app-surface-manuscript" data-surface-mode="manuscript">
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-surface app-surface-workshop" data-surface-mode="workshop">
      <aside
        className={`workshop-sidebar ${sidebarOpen ? 'workshop-sidebar-open' : ''}`}
        aria-label="Workshop sidebar"
      >
        <SidebarNavigation onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="workshop-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="workshop-workspace">
        <WorkshopContextualHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main id="main-content" tabIndex={-1} className="workshop-workspace-main">
          <div className="workshop-workspace-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
