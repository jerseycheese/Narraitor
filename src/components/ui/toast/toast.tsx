'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cssClasses } from '@/lib/utils/classNames';
import { primitiveColors } from '@/lib/design-tokens';

/**
 * Props for the Toast component
 *
 * @example
 * ```tsx * // Basic toast * <Toast title="Success!" /> * * // Toast with description and custom variant * <Toast * title="File uploaded" * description="Your file has been successfully uploaded." * variant="success" * /> * * // Toast with custom duration and dismiss handler * <Toast * title="Auto-save enabled" * duration={3000} * onDismiss={() => console.log('Toast dismissed')} * /> *```
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main title text of the toast notification */
  title: string;
  /** Optional description text shown below the title */
  description?: string;
  /** Visual variant that determines the toast's appearance and semantic meaning */
  variant?: 'success' | 'error' | 'warning' | 'info';
  /** Duration in milliseconds before auto-dismiss. Use Infinity to disable auto-dismiss */
  duration?: number;
  /** Callback function called when the toast is dismissed */
  onDismiss?: () => void;
}

const toastVariants = {
  success: {
    style: { backgroundColor: primitiveColors.green[50] },
  },
  error: {
    style: { backgroundColor: primitiveColors.red[50] },
  },
  warning: {
    style: { backgroundColor: primitiveColors.amber[50] },
  },
  info: {
    style: { backgroundColor: primitiveColors.blue[50] },
  },
};

/**
 * Toast component for displaying temporary notification messages
 *
 * Provides accessible, dismissible notifications with multiple variants for different message types.
 * Supports auto-dismiss with configurable duration and manual dismissal.
 *
 * @example
 * ```tsx * // Basic usage with useToast hook * const toast = useToast() * * const handleSave = () => { * toast.success('Saved successfully', 'Your changes have been saved.') * } * * // Direct component usage * <Toast * title="Welcome!" * description="You have successfully logged in." * variant="success" * onDismiss={() => setShowWelcome(false)} * /> * * // Error notification with custom duration * <Toast * title="Connection failed" * description="Please check your internet connection and try again." * variant="error" * duration={10000} * /> *```
 *
 * @component
 * @accessibility
 * - Uses role="alert" for screen readers
 * - Includes aria-live="polite" for non-intrusive announcements
 * - Dismiss button has proper aria-label
 * - Supports keyboard navigation
 */
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      title,
      description,
      variant = 'info',
      duration = 5000,
      onDismiss,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      if (duration === Infinity) return;

      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    const variantConfig = toastVariants[variant];

    return (
      <div
        ref={ref}
        className={className}
        style={variantConfig.style}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        data-variant={variant}
        {...props}
      >
        <div>
          <div>
            <div>{title}</div>
            {description && <div>{description}</div>}
          </div>
          <button onClick={handleDismiss} aria-label="Dismiss notification">
            <X aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast };
