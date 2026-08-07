'use client';

import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

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

  // Lock body scroll when the game session overlay is active
  useEffect(() => {
    document.body.classList.add('manuscript-overlay-open');
    document.documentElement.classList.add('manuscript-overlay-open');
    return () => {
      document.body.classList.remove('manuscript-overlay-open');
      document.documentElement.classList.remove('manuscript-overlay-open');
    };
  }, []);

  return (
    <div
      className={clsx("manuscript-viewport-layer", className)}
      data-testid="manuscript-session-shell"
    >
      <div className="manuscript-overlay-backdrop" />

      <div className="manuscript-viewport-shell">
        <div className="manuscript-viewport-inner" ref={viewportInnerRef}>
          {/* Header Region */}
          <header className="manuscript-overlay-header" ref={headerRef}>
            {hud}
          </header>

          {/* Main Narrative Stage. A section, not a <main>: AppSurfaceShell
              already wraps the play route in the page's one main landmark, and
              nesting a second one breaks landmark navigation. */}
          <section aria-label="Story" className="manuscript-overlay-main">
            <div className={clsx("manuscript-main-stage manuscript-main-stage-mobile-stack", !marginContent && "manuscript-no-rail")}>
                {marginContent && (
                  <aside
                    className="manuscript-characters-rail manuscript-characters-rail-mobile-stack"
                    aria-label="Scene status"
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
          </section>

          {/* Docked Action Rail */}
          <div ref={actionRailRef}>
            {actionRail}
          </div>
        </div>
      </div>
    </div>
  );
};
