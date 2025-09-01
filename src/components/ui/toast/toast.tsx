"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils/classNames"

/**
 * Props for the Toast component
 * 
 * @example
 * ```tsx
 * // Basic toast
 * <Toast title="Success!" />
 * 
 * // Toast with description and custom variant
 * <Toast 
 *   title="File uploaded" 
 *   description="Your file has been successfully uploaded."
 *   variant="success"
 * />
 * 
 * // Toast with custom duration and dismiss handler
 * <Toast 
 *   title="Auto-save enabled"
 *   duration={3000}
 *   onDismiss={() => console.log('Toast dismissed')}
 * />
 * ```
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main title text of the toast notification */
  title: string
  /** Optional description text shown below the title */
  description?: string
  /** Visual variant that determines the toast's appearance and semantic meaning */
  variant?: 'success' | 'error' | 'warning' | 'info'
  /** Duration in milliseconds before auto-dismiss. Use Infinity to disable auto-dismiss */
  duration?: number
  /** Callback function called when the toast is dismissed */
  onDismiss?: () => void
}

const toastVariants = {
  success: "bg-green-200 border-green-500 text-green-700",
  error: "bg-red-200 border-red-500 text-red-700",
  warning: "bg-amber-200 border-amber-500 text-amber-700",
  info: "bg-blue-100 border-blue-300 text-blue-700",
}

/**
 * Toast component for displaying temporary notification messages
 * 
 * Provides accessible, dismissible notifications with multiple variants for different message types.
 * Supports auto-dismiss with configurable duration and manual dismissal.
 * 
 * @example
 * ```tsx
 * // Basic usage with useToast hook
 * const toast = useToast()
 * 
 * const handleSave = () => {
 *   toast.success('Saved successfully', 'Your changes have been saved.')
 * }
 * 
 * // Direct component usage
 * <Toast 
 *   title="Welcome!" 
 *   description="You have successfully logged in."
 *   variant="success"
 *   onDismiss={() => setShowWelcome(false)}
 * />
 * 
 * // Error notification with custom duration
 * <Toast 
 *   title="Connection failed" 
 *   description="Please check your internet connection and try again."
 *   variant="error"
 *   duration={10000}
 * />
 * ```
 * 
 * @component
 * @accessibility
 * - Uses role="alert" for screen readers
 * - Includes aria-live="polite" for non-intrusive announcements
 * - Dismiss button has proper aria-label
 * - Supports keyboard navigation
 */
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, variant = "info", duration = 5000, onDismiss, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
      if (duration === Infinity) return

      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, duration)

      return () => clearTimeout(timer)
    }, [duration, onDismiss])

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-lg border p-4 shadow-lg transition-all duration-300",
          "min-w-80 max-w-md",
          toastVariants[variant],
          className
        )}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        data-variant={variant}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{title}</div>
            {description && (
              <div className="mt-1 text-sm opacity-90">{description}</div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }
)

Toast.displayName = "Toast"

export { Toast }