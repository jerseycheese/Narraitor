import React from 'react';
import { cn } from '@/lib/utils';

export type LoadingVariant = 'spinner' | 'pulse' | 'dots' | 'skeleton';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingTheme = 'light' | 'dark';

interface LoadingStateProps {
  /** The variant of loading indicator to display */
  variant?: LoadingVariant;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Theme for text and elements (light or dark background) */
  theme?: LoadingTheme;
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
    spinner: 'w-4 h-4',
    text: 'text-sm',
    skeleton: 'h-3',
    dots: 'h-1.5 w-1.5',
  },
  md: {
    spinner: 'w-8 h-8',
    text: 'text-base',
    skeleton: 'h-4',
    dots: 'h-2 w-2',
  },
  lg: {
    spinner: 'w-12 h-12',
    text: 'text-lg',
    skeleton: 'h-5',
    dots: 'h-2.5 w-2.5',
  },
  xl: {
    spinner: 'w-16 h-16',
    text: 'text-xl',
    skeleton: 'h-6',
    dots: 'h-3 w-3',
  },
};

const themeClasses = {
  light: {
    text: 'text-gray-700',
    skeleton: 'bg-gray-300',
    spinnerTrack: 'text-gray-300',
    spinnerFill: 'fill-blue-700',
    dots: 'text-gray-700',
  },
  dark: {
    text: 'text-gray-100',
    skeleton: 'bg-gray-700',
    spinnerTrack: 'text-gray-700',
    spinnerFill: 'fill-blue-300',
    dots: 'text-gray-300',
  },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  theme = 'light',
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
          <svg
            className={cn(
              'animate-spin',
              sizeClasses[size].spinner,
              themeClasses[theme].spinnerTrack,
              themeClasses[theme].spinnerFill
            )}
            role="status"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
            <span className="sr-only">Loading...</span>
          </svg>
        );

      case 'pulse':
        return (
          <div className="animate-pulse" role="status" aria-label="Loading">
            {showAvatar && (
              <div className="flex items-center gap-4 mb-4">
                <div className={cn('rounded-full h-12 w-12', themeClasses[theme].skeleton)} />
                <div className="flex-1">
                  <div className={cn('h-4 rounded w-3/4 mb-2', themeClasses[theme].skeleton)} />
                  <div className={cn('h-3 rounded w-1/2', themeClasses[theme].skeleton)} />
                </div>
              </div>
            )}
            {Array.from({ length: skeletonLines }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded mb-2',
                  themeClasses[theme].skeleton,
                  sizeClasses[size].skeleton,
                  i === skeletonLines - 1 ? 'w-2/3' : 'w-full'
                )}
              />
            ))}
          </div>
        );

      case 'dots':
        return (
          <div className={cn('flex items-center gap-1', themeClasses[theme].dots)} role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  sizeClasses[size].dots,
                  `[animation-delay:${i * 150}ms]`
                )}
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
                    'rounded',
                    themeClasses[theme].skeleton,
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
          className={cn(themeClasses[theme].text, sizeClasses[size].text)}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
};

// Preset loading states for common use cases
export const LoadingSkeleton: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="skeleton" {...props} />
);

export const LoadingPulse: React.FC<Omit<LoadingStateProps, 'variant'>> = (props) => (
  <LoadingState variant="pulse" {...props} />
);
