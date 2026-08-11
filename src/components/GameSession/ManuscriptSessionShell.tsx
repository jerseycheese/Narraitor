'use client';

import React, { useEffect } from 'react';
import { clsx } from 'clsx';

interface ManuscriptSessionShellProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  marginContent?: React.ReactNode;
  className?: string;
}

/**
 * Two rows: a fixed HUD and one scrolling document beneath it.
 *
 * Prose and decision are the same document, so the shell gives them one
 * scroll container and one measure. There is deliberately no slot for a
 * docked panel — anything the player acts on is composed into `children` in
 * reading order.
 */
export const ManuscriptSessionShell: React.FC<ManuscriptSessionShellProps> = ({
  children,
  hud,
  marginContent,
  className,
}) => {
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
        <div className="manuscript-viewport-inner">
          {/* Header Region */}
          <header className="manuscript-overlay-header">
            {hud}
          </header>

          {/* Main Narrative Stage. A section, not a <main>: AppSurfaceShell
              already wraps the play route in the page's one main landmark, and
              nesting a second one breaks landmark navigation. */}
          <section aria-label="Story" className="manuscript-overlay-main">
            <div className={clsx("manuscript-main-stage", !marginContent && "manuscript-no-rail")}>
              {marginContent && (
                <aside
                  className="manuscript-characters-rail"
                  aria-label="Scene status"
                >
                  {marginContent}
                </aside>
              )}

              <div className="manuscript-main-content">
                <div className="manuscript-main-content-inner">
                  {children}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
