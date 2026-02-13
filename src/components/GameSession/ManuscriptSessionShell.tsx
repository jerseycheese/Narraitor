import React from 'react';
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
  return (
    <div 
      className={cssClasses("manuscript-viewport-layer", className)}
      data-testid="manuscript-session-shell"
    >
      <div className="manuscript-overlay-backdrop" />
      
      <div className="manuscript-viewport-shell">
        <div className="manuscript-viewport-inner">
          {/* Header Region */}
          <header className="manuscript-overlay-header">
            {hud}
          </header>

          {/* Main Narrative Stage */}
          <main className="manuscript-overlay-main">
            <div className="manuscript-main-stage">
              <div className="manuscript-main-content">
                {children}
              </div>
              
              {marginContent && (
                <aside 
                  className="manuscript-characters-rail"
                  aria-label="Suggested actions"
                >
                  {marginContent}
                </aside>
              )}
              
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
