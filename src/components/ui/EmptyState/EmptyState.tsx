import React from 'react';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state component
 * Provides consistent styling for empty states across the application.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div className={clsx('component-empty-state', className)}>
      {icon && (
        <div>
          {icon}
        </div>
      )}
      <div>
        <h3>
          {title}
        </h3>
        {description && (
          <p>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};