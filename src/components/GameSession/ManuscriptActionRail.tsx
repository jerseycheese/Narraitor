import React from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptActionRailProps {
  children: React.ReactNode;
  className?: string;
  isStreaming?: boolean;
}

export const ManuscriptActionRail: React.FC<ManuscriptActionRailProps> = ({
  children,
  className,
  isStreaming = false,
}) => {
  return (
    <footer 
      id="manuscript-action-rail"
      className={cssClasses(
        isStreaming && "manuscript-action-rail-streaming",
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
