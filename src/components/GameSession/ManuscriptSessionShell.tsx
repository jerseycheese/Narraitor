'use client';

import React, { useRef, useEffect } from 'react';
import { cssClasses } from '@/lib/utils';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface ManuscriptSessionShellProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  actionRail?: React.ReactNode;
  marginContent?: React.ReactNode;
  mobileTopContent?: React.ReactNode;
  className?: string;
}

export const ManuscriptSessionShell: React.FC<ManuscriptSessionShellProps> = ({
  children,
  hud,
  actionRail,
  marginContent,
  mobileTopContent,
  className,
}) => {
  const { theme } = useTheme();
  const railRef = useRef<HTMLElement>(null);
  const viewportInnerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const actionRailRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when the game session overlay is active
  useEffect(() => {
    document.body.classList.add('manuscript-overlay-open');
    document.documentElement.classList.add('manuscript-overlay-open');
    return () => {
      document.body.classList.remove('manuscript-overlay-open');
      document.documentElement.classList.remove('manuscript-overlay-open');
    };
  }, []);

  useEffect(() => {
    if (theme !== 'ds1') return;
    const rail = railRef.current;
    const container = viewportInnerRef.current;
    if (!rail || !container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        if (width > 0) {
          container.style.setProperty('--manuscript-rail-width', `${width}px`);
        } else {
          container.style.removeProperty('--manuscript-rail-width');
        }
      }
    });

    observer.observe(rail);
    return () => observer.disconnect();
  }, [theme]);

  // Match prototype rail/panel geometry so desktop capture metrics stay aligned.
  // Only needed for DS1 which has a 3-column rail layout.
  useEffect(() => {
    if (theme !== 'ds1') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const container = viewportInnerRef.current;
    const header = headerRef.current;
    const actionRailContainer = actionRailRef.current;

    if (!container || !header || !actionRailContainer) return;

    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
    let frameId: number | null = null;

    const syncPosition = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;

        const rail = railRef.current;
        const actionRailElement = actionRailContainer.querySelector(
          '#manuscript-action-rail',
        ) as HTMLElement | null;
        const mainStage = rail?.closest('.manuscript-main-stage') as HTMLElement | null;

        const characterPanel = document.querySelector('.manuscript-hud-character-panel') as HTMLElement | null;
        const toolsPanel = document.querySelector(
          '.manuscript-hud-panel-left:not(.manuscript-hud-character-panel)',
        ) as HTMLElement | null;

        if (!rail || !actionRailElement) return;

        if (!desktopMediaQuery.matches) {
          rail.style.removeProperty('position');
          rail.style.removeProperty('top');
          rail.style.removeProperty('bottom');
          rail.style.removeProperty('left');
          rail.style.removeProperty('width');
          rail.style.removeProperty('max-height');
          rail.style.removeProperty('z-index');

          if (characterPanel) {
            characterPanel.style.removeProperty('max-height');
            characterPanel.style.removeProperty('height');
            characterPanel.style.removeProperty('width');
          }
          if (toolsPanel) {
            toolsPanel.style.removeProperty('max-height');
            toolsPanel.style.removeProperty('width');
            toolsPanel.style.removeProperty('height');
          }
          return;
        }

        if (!mainStage) return;

        const headerRect = header.getBoundingClientRect();
        const actionRailRect = actionRailElement.getBoundingClientRect();
        const mainStageRect = mainStage.getBoundingClientRect();

        // Visual breathing room between fixed-position panels.
        // This is a layout geometry constant (not a design token) because it
        // governs runtime overlap prevention, not themeable appearance.
        const gapPx = 8;

        // Subtract 3x the gap to account for spacing above the character panel,
        // between the character and tools panels, and below the tools panel.
        const availableSpace = actionRailRect.top - headerRect.bottom - (gapPx * 3);
        const halfSpace = Math.floor(availableSpace / 2);
        const panelTop = headerRect.bottom + gapPx;

        const railRect = rail.getBoundingClientRect();
        const railHeight = Math.min(railRect.height, halfSpace);
        const railTop = actionRailRect.top - railHeight - gapPx;
        const railWidth = Math.max(0, Math.min(railRect.width, mainStageRect.width));

        if (characterPanel) {
          characterPanel.style.position = 'fixed';
          characterPanel.style.maxHeight = `${halfSpace}px`;
          characterPanel.style.top = `${panelTop}px`;
          characterPanel.style.left = `${mainStageRect.left}px`;
          characterPanel.style.width = `${railWidth}px`;
          characterPanel.style.zIndex = '40';
          characterPanel.style.removeProperty('height');
        }
        if (toolsPanel) {
          toolsPanel.style.position = 'fixed';
          toolsPanel.style.maxHeight = `${halfSpace}px`;
          toolsPanel.style.top = `${panelTop}px`;
          toolsPanel.style.left = `${mainStageRect.left}px`;
          toolsPanel.style.width = `${railWidth}px`;
          toolsPanel.style.zIndex = '40';
          toolsPanel.style.removeProperty('height');
        }

        rail.style.maxHeight = `${halfSpace}px`;
        rail.style.position = 'fixed';
        rail.style.top = `${railTop}px`;
        rail.style.removeProperty('bottom');
        rail.style.left = `${mainStageRect.left}px`;
        rail.style.width = `${railWidth}px`;
        rail.style.zIndex = '20';
      });
    };

    syncPosition();

    const resizeObserver = new ResizeObserver(() => {
      syncPosition();
    });
    resizeObserver.observe(actionRailContainer);
    resizeObserver.observe(container);
    if (railRef.current) {
      resizeObserver.observe(railRef.current);
    }

    const handleMediaChange = () => {
      syncPosition();
    };
    desktopMediaQuery.addEventListener('change', handleMediaChange);

    const mutationObserver = new MutationObserver(() => {
      syncPosition();
      if (railRef.current) {
        resizeObserver.observe(railRef.current);
      }
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      desktopMediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition);
    };
  }, [theme]);

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
            {mobileTopContent}

            <div className={cssClasses("manuscript-main-stage manuscript-main-stage-mobile-stack", !marginContent && "manuscript-no-rail")}>
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
                  <div className="manuscript-main-content-inner">
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
