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

  return (
    <div
      className={cssClasses("manuscript-viewport-layer", className)}
      data-testid="manuscript-session-shell"
    >
      <div className="manuscript-overlay-backdrop" />

      <div className="manuscript-viewport-shell">
        <div className="manuscript-viewport-inner" ref={viewportInnerRef}>
          {/* Header Region */}
          <header className="manuscript-overlay-header">
            {hud}
          </header>

          {/* Main Narrative Stage */}
          <main className="manuscript-overlay-main">
            <div className="manuscript-main-stage">
              {marginContent && (
                <aside
                  className="manuscript-characters-rail"
                  aria-label="Suggested actions"
                  ref={railRef}
                >
                  {marginContent}
                </aside>
              )}

              <div className="manuscript-main-content">
                {children}
              </div>

              <div className="manuscript-rail-spacer" />
            </div>
          </main>

          {/* Docked Action Rail */}
          {actionRail}
        </div>
      </div>
    </div>
  );
};
