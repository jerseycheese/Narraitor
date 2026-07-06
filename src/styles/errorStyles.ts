/**
 * Standardized error styling patterns for consistent error display across the
 * application. Class definitions live in src/styles/error-block.css (imported
 * via globals.css) — these were Tailwind utility strings until the audit found
 * them rendering inert in a post-Tailwind codebase.
 */
export const errorStyles = {
  // Block-level error containers
  container: 'error-block',

  // Individual error messages
  message: 'error-block-message',

  // Form input error states
  input: {
    border: 'input-error',
    focus: 'input-error',
    combined: 'input-error',
  },
} as const;
