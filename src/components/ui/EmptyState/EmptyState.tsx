import React from 'react';
import { cn } from '@/lib/utils/classNames';

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
    ? 'py-6 space-y-2'
    : 'py-12 space-y-4';

  const titleClasses = variant === 'compact'
    ? 'text-base font-medium'
    : 'text-lg font-medium';

  const descriptionClasses = variant === 'compact'
    ? 'text-xs'
    : 'text-sm';

  return (
    <div className={cn(
      'text-center',
      baseClasses,
      className
    )}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <div>
        <h3 className={cn('text-gray-700', titleClasses)}>
          {title}
        </h3>
        {description && (
          <p className={cn('text-gray-700 mt-2', descriptionClasses)}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};