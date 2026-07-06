import React from 'react';
import { clsx } from 'clsx';
import './EmptyState.css';

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
        <div className="component-empty-state-icon">
          {icon}
        </div>
      )}
      <div className="component-empty-state-content">
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
        <div className="component-empty-state-actions">
          {action}
        </div>
      )}
    </div>
  );
};