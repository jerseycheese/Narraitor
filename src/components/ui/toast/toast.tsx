import * as React from "react"
import { cn } from "@/lib/utils/classNames"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onDismiss?: () => void
}

const toastVariants = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, variant = "info", duration = 5000, onDismiss, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
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