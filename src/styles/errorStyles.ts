/**
 * Standardized error styling patterns for consistent error display across the application
 */
export const errorStyles = {
  // Block-level error containers
  container: 'p-4 bg-red-50 border border-red-200 rounded-lg',
  
  // Individual error messages
  message: 'text-red-600 text-sm mt-1',
  
  // Form input error states
  input: {
    border: 'border-destructive',
    focus: 'focus-visible:ring-destructive',
    combined: 'border-destructive focus-visible:ring-destructive'
  },
  
  // Error list styling
  list: {
    container: 'space-y-1',
    item: 'text-red-600 text-sm'
  }
} as const;