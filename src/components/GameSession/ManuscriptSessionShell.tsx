'use client';

import React, { useRef, useEffect } from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptSessionShellProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  actionRail?: React.ReactNode;
  marginContent?: React.ReactNode;
  className?: string;
}

export const ManuscriptSessionShell: React.FC<ManuscriptSessionShellProps> = ({
  children,
  hud,
  actionRail,
  marginContent,
  className,
}) => {
  const railRef = useRef<HTMLElement>(null);
  const viewportInnerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const actionRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const container = viewportInnerRef.current;
    if (!rail || !container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          container.style.setProperty('--manuscript-rail-width', `${width}px`);
        } else {
          container.style.removeProperty('--manuscript-rail-width');
        }
      }
    });

    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  // Position character rail at the bottom (above action rail) on desktop
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const rail = railRef.current;
    const header = headerRef.current;
    const actionRailEl = actionRailRef.current;
    const mainStage = rail?.closest('.manuscript-main-stage') as HTMLElement | null;

    if (!rail || !header || !actionRailEl || !mainStage) return;

    const syncPosition = () => {
      const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');

      // Find dropdown panels (Character Snapshot, Tools menu)
      const characterPanel = document.querySelector('.manuscript-hud-character-panel') as HTMLElement | null;
      const toolsPanels = document.querySelectorAll('.manuscript-hud-panel-left:not(.manuscript-hud-character-panel)');
      const toolsPanel = toolsPanels[0] as HTMLElement | null;

      // Only apply fixed positioning on desktop
      if (!desktopMediaQuery.matches) {
        rail.style.removeProperty('position');
        rail.style.removeProperty('top');
        rail.style.removeProperty('left');
        rail.style.removeProperty('width');
        rail.style.removeProperty('max-height');
        rail.style.removeProperty('z-index');
        if (characterPanel) characterPanel.style.removeProperty('max-height');
        if (characterPanel) characterPanel.style.removeProperty('width');
        if (toolsPanel) toolsPanel.style.removeProperty('max-height');
        if (toolsPanel) toolsPanel.style.removeProperty('width');
        return;
      }

      const headerRect = header.getBoundingClientRect();
      const mainStageRect = mainStage.getBoundingClientRect();
      const actionRailRect = actionRailEl.getBoundingClientRect();
      const gapPx = 8;

      // Calculate available space between header bottom and action rail top
      const availableSpace = actionRailRect.top - headerRect.bottom - (gapPx * 3);
      const halfSpace = Math.floor(availableSpace / 2);

      // Set max-height for characters rail (bottom half of available space)
      rail.style.maxHeight = `${halfSpace}px`;

      // Position characters rail at the bottom (above action rail)
      const railRect = rail.getBoundingClientRect();
      const railHeight = Math.min(railRect.height, halfSpace);
      const railTop = actionRailRect.top - railHeight - gapPx;
      const railWidth = Math.max(0, Math.min(railRect.width, mainStageRect.width));

      rail.style.position = 'fixed';
      rail.style.top = `${railTop}px`;
      rail.style.left = `${mainStageRect.left}px`;
      rail.style.width = `${railWidth}px`;
      rail.style.zIndex = '20';

      // Calculate space for dropdown panels - fill from header to rail top
      const panelAvailableHeight = railTop - headerRect.bottom - gapPx;

      // Set max-height for dropdown panels to fill all space above the rail
      if (characterPanel) {
        characterPanel.style.maxHeight = `${panelAvailableHeight}px`;
        characterPanel.style.width = `${railWidth}px`;
      }
      if (toolsPanel) {
        toolsPanel.style.maxHeight = `${panelAvailableHeight}px`;
        toolsPanel.style.width = `${railWidth}px`;
      }
    };

    // Sync on mount and when layout changes
    syncPosition();

    const resizeObserver = new ResizeObserver(syncPosition);
    resizeObserver.observe(rail);
    resizeObserver.observe(actionRailEl);

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    mediaQuery.addEventListener('change', syncPosition);

    // Watch for dropdown panels being added/removed from DOM
    const mutationObserver = new MutationObserver(syncPosition);
    mutationObserver.observe(header, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      mediaQuery.removeEventListener('change', syncPosition);
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition);
    };
  }, []);

  return (
    <div
      className={cssClasses("manuscript-viewport-layer", className)}
      data-testid="manuscript-session-shell"
    >
      <div className="manuscript-overlay-backdrop" />

      <div className="manuscript-viewport-shell">
        <div className="manuscript-viewport-inner" ref={viewportInnerRef}>
          {/* Header Region */}
          <header className="manuscript-overlay-header" ref={headerRef}>
            {hud}
          </header>

          {/* Main Narrative Stage */}
          <main className="manuscript-overlay-main">
            <div className="manuscript-main-stage manuscript-main-stage-mobile-stack">
              {marginContent && (
                <aside
                  className="manuscript-characters-rail manuscript-characters-rail-mobile-stack"
                  aria-label="Characters present"
                  ref={railRef}
                >
                  {marginContent}
                </aside>
              )}

              <div className="manuscript-main-content">
                <div className="max-w-3xl mx-auto">
                  {children}
                </div>
              </div>

              <div className="manuscript-rail-spacer" aria-hidden="true" />
            </div>
          </main>

          {/* Docked Action Rail */}
          <div ref={actionRailRef}>
            {actionRail}
          </div>
        </div>
      </div>
    </div>
  );
};
