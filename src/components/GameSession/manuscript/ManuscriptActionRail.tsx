import React from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptActionRailProps {
  children: React.ReactNode;
  className?: string;
}

export const ManuscriptActionRail: React.FC<ManuscriptActionRailProps> = ({
  children,
  className,
}) => {
  return (
    <div 
      className={cssClasses(
        "w-full bg-background/95 backdrop-blur-md border-t border-border shadow-lg px-4 py-4 md:py-6",
        className
      )}
      data-testid="manuscript-action-rail"
    >
      <div className="max-w-3xl mx-auto">
        {children}
      </div>
    </div>
  );
};
