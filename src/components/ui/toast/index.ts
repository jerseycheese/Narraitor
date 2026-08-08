/**
 * Toast Notification System
 * 
 * A toast notification system for Narraitor with support for multiple variants,
 * auto-dismissal, manual dismissal, and accessibility features.
 * 
 * @example
 * ```tsx
 * // 1. Set up the toast system in your app root
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *       <Toaster position="bottom-right" maxToasts={5} />
 *     </ToastProvider>
 *   )
 * }
 * 
 * // 2. Use toasts in your components
 * function MyComponent() {
 *   const toast = useToast()
 * 
 *   const handleSave = async () => {
 *     try {
 *       await saveData()
 *       toast.success('Saved successfully', 'Your changes have been saved.')
 *     } catch (error) {
 *       toast.error('Save failed', 'Please try again later.')
 *     }
 *   }
 * 
 *   return <button onClick={handleSave}>Save</button>
 * }
 * ```
 * 
 * @integration
 * Integration with AutoSave Service:
 * - Success toasts for manual saves
 * - Error toasts for save failures
 * - Automatic cleanup and dismissal
 * 
 * @accessibility
 * - Screen reader announcements
 * - Keyboard navigation support
 * - ARIA labels and roles
 * - Focus management
 * 
 * @mobile
 * - Responsive positioning
 * - Touch-friendly dismiss buttons
 * - Proper viewport handling
 * 
 * @module Toast
 */

// Core components
export { Toast } from './toast'
export { Toaster, ToastProvider, useToast } from './toaster'

// Type definitions