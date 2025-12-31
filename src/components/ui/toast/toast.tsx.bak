"use client"

import React, { useState, useEffect } from "react"
import { X } from 'lucide-react'
import { cn } from "@/lib/utils/classNames"
import { primitiveColors } from "@/lib/design-tokens"

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
  success: {
    className: "border-green-600 text-green-900",
    style: { backgroundColor: primitiveColors.green[50] }
  },
  error: {
    className: "border-red-600 text-red-900",
    style: { backgroundColor: primitiveColors.red[50] }
  },
  warning: {
    className: "border-amber-600 text-amber-900",
    style: { backgroundColor: primitiveColors.amber[50] }
  },
  info: {
    className: "border-blue-600 text-blue-900",
    style: { backgroundColor: primitiveColors.blue[50] }
  },
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

    const variantConfig = toastVariants[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-lg border p-4 shadow-lg transition-all duration-300",
          "min-w-80 max-w-md",
          variantConfig.className,
          className
        )}
        style={variantConfig.style}
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
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }
)

Toast.displayName = "Toast"

export { Toast }
