"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { Toast } from "./toast"

/**
 * Data structure for a toast notification
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
 */
export interface ToasterProps {
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

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    ...context,
    success: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) => 
      context.addToast({ title, description, variant: 'info' }),
  }
}

export function Toaster({ maxToasts = 5 }: ToasterProps) {
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

  const visibleToasts = toasts.slice(-maxToasts)

  return createPortal(
    <div>
      {visibleToasts.map((toast) => (
        <div key={toast.id} >
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