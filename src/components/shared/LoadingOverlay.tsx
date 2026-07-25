'use client';

import React from 'react';
import { clsx } from 'clsx';
import { LoadingState, LoadingVariant } from '@/components/ui/LoadingState/LoadingState';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Loading indicator variant */
  variant?: LoadingVariant;
  /** Loading message to display */
  message?: string;
  /** Optional cancel callback - shows cancel button if provided */
  onCancel?: () => void;
  /** Additional CSS classes for the overlay content */
  className?: string;
}

/**
 * LoadingOverlay - Full-screen loading overlay for navigation transitions.
 *
 * Reuses the shared SimpleModal/Dialog primitive for dialog semantics, focus
 * trapping, and Escape handling instead of hand-rolling them. The overlay is
 * not dismissable by backdrop click; Escape cancels only when an `onCancel`
 * handler is provided (i.e. recoverable/error states).
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
  return (
    <SimpleModal
      isOpen={isVisible}
      onClose={() => onCancel?.()}
      title="Please wait"
      description={message}
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={Boolean(onCancel)}
      className={clsx('component-loading-overlay', className)}
      footer={
        onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : undefined
      }
    >
      <div aria-live="polite" aria-label="Loading">
        <LoadingState
          variant={variant}
          size="lg"
        />
      </div>
    </SimpleModal>
  );
};
