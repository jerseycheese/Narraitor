import React from 'react';
import { clsx } from 'clsx';

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
      className={clsx(
        isStreaming && 'manuscript-action-rail-streaming',
        className
      )}
      data-testid="manuscript-action-rail"
    >
      {children}
    </footer>
  );
};
