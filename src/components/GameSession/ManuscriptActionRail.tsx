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
    <footer 
      id="manuscript-action-rail"
      className={cssClasses(
        className
      )}
      data-testid="manuscript-action-rail"
    >
      <div className="manuscript-input-row">
        <div className="w-full">
          {children}
        </div>
      </div>
    </footer>
  );
};
