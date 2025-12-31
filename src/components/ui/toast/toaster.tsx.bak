"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { Toast } from "./toast"

/**
 * Data structure for a toast notification
 * 
 * @example
 * ```tsx
 * const toastData: ToastData = {
 *   id: 'unique-id',
 *   title: 'Operation completed',
 *   description: 'Your file has been processed successfully.',
 *   variant: 'success',
 *   duration: 5000
 * }
 * ```
 */
export interface ToastData {
  /** Unique identifier for the toast */
  id: string
  /** The main title text of the toast */
  title: string
  /** Optional description text shown below the title */
  description?: string
  /** Visual variant that determines the toast's appearance */
  variant?: 'success' | 'error' | 'warning' | 'info'
  /** Duration in milliseconds before auto-dismiss */
  duration?: number
}

/**
 * Props for the Toaster component
 * 
 * @example
 * ```tsx
 * // Default position (bottom-right)
 * <Toaster />
 * 
 * // Custom position and max toasts
 * <Toaster position="top-right" maxToasts={3} />
 * ```
 */
export interface ToasterProps {
  /** Screen position where toasts should appear */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Maximum number of toasts to display simultaneously */
  maxToasts?: number
}

const ToastContext = createContext<{
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
} | null>(null)

/**
 * Toast Provider component that manages toast state and provides toast context
 * 
 * Must be placed at the root of your application to enable toast functionality.
 * Provides the toast context that allows components to add, remove, and manage toasts.
 * 
 * @example
 * ```tsx
 * // In your app layout or root component
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *       <Toaster />
 *     </ToastProvider>
 *   )
 * }
 * ```
 * 
 * @component
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastData = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue = useMemo(
    () => ({ toasts, addToast, removeToast, removeAllToasts }),
    [toasts, addToast, removeToast, removeAllToasts]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * Hook for managing toast notifications
 * 
 * Provides methods to display different types of toast notifications and manage the toast queue.
 * Must be used within a ToastProvider.
 * 
 * @example
 * ```tsx
 * import { Button } from '@/components/ui/button'
 * 
 * function MyComponent() {
 *   const toast = useToast()
 * 
 *   const handleSuccess = () => {
 *     toast.success('Operation completed', 'Your changes have been saved.')
 *   }
 * 
 *   const handleError = () => {
 *     toast.error('Something went wrong', 'Please try again later.')
 *   }
 * 
 *   const handleCustomToast = () => {
 *     const id = toast.addToast({
 *       title: 'Custom notification',
 *       variant: 'info',
 *       duration: 10000
 *     })
 *     
 *     // Remove it later
 *     setTimeout(() => toast.removeToast(id), 5000)
 *   }
 * 
 *   return (
 *     <div>
 *       <Button onClick={handleSuccess}>Show Success</Button>
 *       <Button onClick={handleError}>Show Error</Button>
 *       <Button onClick={handleCustomToast}>Show Custom</Button>
 *     </div>
 *   )
 * }
 * ```
 * 
 * @returns Object containing toast management methods
 * @throws {Error} When used outside of ToastProvider
 * 
 * @hook
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    ...context,
    /** Display a success toast notification */
    success: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'success' }),
    /** Display an error toast notification */
    error: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'error' }),
    /** Display a warning toast notification */
    warning: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'warning' }),
    /** Display an info toast notification */
    info: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'info' }),
  }
}

/**
 * Toaster component that renders and manages multiple toast notifications
 * 
 * Displays toasts in a fixed position on the screen using a portal.
 * Automatically manages the toast queue and handles positioning.
 * 
 * @example
 * ```tsx
 * // Basic usage with default settings
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *       <Toaster />
 *     </ToastProvider>
 *   )
 * }
 * 
 * // Custom positioning and limits
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *       <Toaster position="top-right" maxToasts={3} />
 *     </ToastProvider>
 *   )
 * }
 * ```
 * 
 * @component
 * @integration
 * Used in conjunction with ToastProvider and useToast hook:
 * 1. Wrap your app with ToastProvider
 * 2. Add Toaster component to your layout
 * 3. Use useToast hook in components to trigger notifications
 * 
 * @accessibility
 * - Uses createPortal to render outside normal DOM hierarchy
 * - Maintains proper focus management
 * - Toasts are automatically announced to screen readers
 * - Responsive positioning for mobile devices
 */
export function Toaster({ position = 'bottom-right', maxToasts = 5 }: ToasterProps) {
  const { toasts, removeToast } = useToast()
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.id = 'toast-container'
    document.body.appendChild(div)
    setContainer(div)

    return () => {
      document.body.removeChild(div)
    }
  }, [])

  if (!container) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const visibleToasts = toasts.slice(-maxToasts)

  return createPortal(
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]} pointer-events-none max-w-[calc(100vw-2rem)]`}
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    container
  )
}
