import React from 'react';
import { cssClasses } from '@/lib/utils/classNames';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'centered' | 'compact';
  className?: string;
}

/**
 * Reusable empty state component
 * Provides consistent styling for empty states across the application.
 * The `variant` prop supports 'centered' and 'compact' options.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'centered',
  className,
}) => {
  const baseClasses = variant === 'compact' 
    ? ''
    : '';

  const titleClasses = variant === 'compact'
    ? ''
    : '';

  const descriptionClasses = variant === 'compact'
    ? ''
    : '';

  return (
    <div className={cssClasses(
      'component-empty-state',
      '',
      baseClasses,
      className
    )}>
      {icon && (
        <div >
          {icon}
        </div>
      )}
      <div>
        <h3 className={cssClasses('', titleClasses)}>
          {title}
        </h3>
        {description && (
          <p className={cssClasses('', descriptionClasses)}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div >
          {action}
        </div>
      )}
    </div>
  );
};