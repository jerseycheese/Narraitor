/**
 * Standardized error styling patterns for consistent error display across the application
 */
export const errorStyles = {
  // Block-level error containers
  container: 'p-4 bg-destructive/10 border border-destructive rounded-lg',

  // Individual error messages
  message: 'text-destructive text-sm mt-1',

  // Form input error states
  input: {
    border: 'border-destructive',
    focus: 'focus-visible:ring-destructive',
    combined: 'border-destructive focus-visible:ring-destructive'
  },

  // Error list styling
  list: {
    container: 'space-y-1',
    item: 'text-destructive text-sm'
  }
} as const;