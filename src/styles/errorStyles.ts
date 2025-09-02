/**
 * Standardized error styling patterns for consistent error display across the application
 */
export const errorStyles = {
  // Block-level error containers
  container: 'p-4 bg-red-200 border border-red-500 rounded-lg',
  
  // Individual error messages
  message: 'text-red-700 text-sm mt-1',
  
  // Form input error states
  input: {
    border: 'border-destructive',
    focus: 'focus-visible:ring-destructive',
    combined: 'border-destructive focus-visible:ring-destructive'
  },
  
  // Error list styling
  list: {
    container: 'space-y-1',
    item: 'text-red-700 text-sm'
  }
} as const;