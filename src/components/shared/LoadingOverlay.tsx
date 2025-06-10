'use client';

import React, { useEffect } from 'react';
import { LoadingState, LoadingVariant } from '@/components/ui/LoadingState/LoadingState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Loading indicator variant */
  variant?: LoadingVariant;
  /** Loading message to display */
  message?: string;
  /** Optional cancel callback - shows cancel button if provided */
  onCancel?: () => void;
  /** Additional CSS classes for the overlay */
  className?: string;
}

/**
 * LoadingOverlay - Full-screen loading overlay for navigation transitions
 * 
 * Provides a consistent loading experience across the application with:
 * - Full-screen modal overlay that prevents interaction
 * - Multiple loading variants (spinner, skeleton, dots, pulse)
 * - Optional cancel functionality for long operations
 * - Proper accessibility with ARIA attributes and focus management
 * - Keyboard support (Escape key to cancel)
 * 
 * @param props LoadingOverlayProps
 * @returns JSX element or null if not visible
 * 
 * @example
 * ```tsx
 * <LoadingOverlay 
 *   isVisible={isLoading}
 *   variant="skeleton"
 *   message="Loading your world..."
 *   onCancel={() => setIsLoading(false)}
 * />
 * ```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  variant = 'spinner',
  message = 'Loading...',
  onCancel,
  className,
}) => {
  // Handle keyboard events
  useEffect(() => {
    if (!isVisible || !onCancel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onCancel]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-overlay-title"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center space-y-4">
          {/* Loading indicator */}
          <div className="flex justify-center">
            <div aria-live="polite" aria-label="Loading">
              <LoadingState
                variant={variant}
                size="lg"
                theme="light"
                className="dark:text-white"
                centered={false}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <h2 
              id="loading-overlay-title"
              className="text-lg font-medium text-gray-900 dark:text-white mb-2"
            >
              Please wait
            </h2>
            <p 
              className="text-gray-600 dark:text-gray-300"
              aria-live="polite"
            >
              {message}
            </p>
          </div>

          {/* Cancel button */}
          {onCancel && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
                tabIndex={0}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};