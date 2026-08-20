/**
 * useToast throws unless the tree is wrapped in ToastProvider, and toasts stay
 * invisible unless a Toaster is rendered inside that provider. Both are needed.
 */

export { Toast } from './toast'
export { Toaster, ToastProvider, useToast } from './toaster'
