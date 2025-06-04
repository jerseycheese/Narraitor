import React from 'react';
import { cn } from '@/lib/utils';

export type LoadingVariant = 'spinner' | 'pulse' | 'dots' | 'skeleton';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingStateProps {
  /** The variant of loading indicator to display */
  variant?: LoadingVariant;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Optional message to display below the loading indicator */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to center the loading state in its container */
  centered?: boolean;
  /** Whether to show the loading state inline */
  inline?: boolean;
  /** For skeleton variant: number of skeleton lines to show */
  skeletonLines?: number;
  /** For skeleton variant: whether to show avatar placeholder */
  showAvatar?: boolean;
}

const sizeClasses = {
  sm: {
    spinner: 'h-4 w-4 border-2',
    text: 'text-sm',
    skeleton: 'h-3',
    dots: 'h-1.5 w-1.5',
  },
  md: {
    spinner: 'h-8 w-8 border-4',
    text: 'text-base',
    skeleton: 'h-4',
    dots: 'h-2 w-2',
  },
  lg: {
    spinner: 'h-12 w-12 border-4',
    text: 'text-lg',
    skeleton: 'h-5',
    dots: 'h-2.5 w-2.5',
  },
  xl: {
    spinner: 'h-16 w-16 border-4',
    text: 'text-xl',
    skeleton: 'h-6',
    dots: 'h-3 w-3',
  },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  message,
  className,
  centered = true,
  inline = false,
  skeletonLines = 3,
  showAvatar = false,
}) => {
  const containerClasses = cn(
    inline ? 'inline-flex items-center gap-2' : 'flex flex-col items-center gap-2',
    centered && !inline && 'justify-center p-8',
    className
  );

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-solid border-current border-r-transparent',
              sizeClasses[size].spinner
            )}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
        );

      case 'pulse':
        return (
          <div className="animate-pulse" role="status" aria-label="Loading">
            {showAvatar && (
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-gray-200 h-12 w-12" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            )}
            {Array.from({ length: skeletonLines }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bg-gray-200 rounded mb-2',
                  sizeClasses[size].skeleton,
                  i === skeletonLines - 1 ? 'w-2/3' : 'w-full'
                )}
              />
            ))}
          </div>
        );

      case 'dots':
        return (
          <div className="flex items-center gap-1" role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  sizeClasses[size].dots
                )}
                style={{
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
            <span className="sr-only">Loading...</span>
          </div>
        );

      case 'skeleton':
        return (
          <div className="w-full animate-pulse" role="status" aria-label="Loading">
            <div className="space-y-2">
              {Array.from({ length: skeletonLines }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'bg-gray-200 rounded',
                    sizeClasses[size].skeleton,
                    i === 0 && 'w-3/4',
                    i === 1 && 'w-full',
                    i === 2 && 'w-5/6',
                    i > 2 && 'w-full'
                  )}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoadingIndicator()}
      {message && (
        <p
          className={cn('text-gray-600', sizeClasses[size].text)}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
};

// Preset loading states for common use cases
export const LoadingSpinner: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="spinner" {...props} />
);

export const LoadingSkeleton: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="skeleton" {...props} />
);

export const LoadingDots: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="dots" {...props} />
);

export const LoadingPulse: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="pulse" {...props} />
);
