import * as React from "react"
import { createPortal } from "react-dom"
import { Toast } from "./toast"

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  maxToasts?: number
}

const ToastContext = React.createContext<{
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const addToast = React.useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastData = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  const contextValue = React.useMemo(
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
  const context = React.useContext(ToastContext)
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

export function Toaster({ position = 'bottom-right', maxToasts = 5 }: ToasterProps) {
  const { toasts, removeToast } = useToast()
  const [container, setContainer] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
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
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]} pointer-events-none`}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
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