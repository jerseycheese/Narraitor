import React from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptSessionShellProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  actionRail?: React.ReactNode;
  className?: string;
}

export const ManuscriptSessionShell: React.FC<ManuscriptSessionShellProps> = ({
  children,
  hud,
  actionRail,
  className,
}) => {
  return (
    <div 
      className={cssClasses(
        "relative min-h-screen flex flex-col bg-background",
        className
      )}
      data-testid="manuscript-session-shell"
    >
      {/* Floating HUD Container */}
      {hud && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
          {hud}
        </div>
      )}

      {/* Main Narrative Stage */}
      <main className="flex-grow flex flex-col items-center px-4 pt-20 pb-40">
        <div className="w-full max-w-3xl">
          {children}
        </div>
      </main>

      {/* Docked Action Rail */}
      {actionRail && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          {actionRail}
        </div>
      )}
    </div>
  );
};
