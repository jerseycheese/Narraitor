'use client';

import React, { useEffect, useRef } from 'react';
import { LoadingState, LoadingVariant } from '@/components/ui/LoadingState/LoadingState';
import { Button } from '@/components/ui/button';
import { cssClasses } from '@/lib/utils';

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
 * ```tsx * <LoadingOverlay * isVisible={isLoading} * variant="skeleton" * message="Loading your world..." * onCancel={() => setIsLoading(false)} * /> *```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  variant = 'spinner',
  message = 'Loading...',
  onCancel,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events and focus trapping
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onCancel) {
        onCancel();
      }
      
      // Simple focus trap - keep focus within the dialog
      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        
        const focusableElements = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
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
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-overlay-title"
      className={cssClasses(
        '',
        '',
        className
      )}
    >
      <div>
        <div>
          {/* Loading indicator */}
          <div>
            <div aria-live="polite" aria-label="Loading">
              <LoadingState
                variant={variant}
                size="lg"
                theme="light"
                
                centered={false}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <h2 
              id="loading-overlay-title"
              
            >
              Please wait
            </h2>
            <p 
              
              aria-live="polite"
            >
              {message}
            </p>
          </div>

          {/* Cancel button */}
          {onCancel && (
            <div>
              <Button
                variant="outline"
                onClick={onCancel}
                
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