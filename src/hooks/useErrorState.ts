import { useState, useCallback } from 'react';

/**
 * Configuration options for useErrorState hook
 */
export interface UseErrorStateOptions {
  /** Initial error message */
  initialError?: string | null;
  /** Auto-clear error after specified milliseconds */
  autoClearMs?: number;
}

/**
 * Return type for useErrorState hook
 */
export interface UseErrorStateReturn {
  /** Current error message */
  error: string | null;
  /** Whether there is currently an error */
  hasError: boolean;
  /** Set an error message */
  setError: (error: string | null) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Set error from an Error object or unknown error */
  setErrorFromCatch: (error: unknown) => void;
}

/**
 * Custom hook for managing error state
 * 
 * This hook abstracts the common pattern of:
 * - Error state management  
 * - Error clearing
 * - Error extraction from catch blocks
 * 
 * @param options Configuration options for error state
 * @returns Error state management object
 * 
 * @example
 * ```tsx
 * const { error, hasError, setError, clearError, setErrorFromCatch } = useErrorState();
 * 
 * const handleSave = async () => {
 *   try {
 *     clearError(); // Clear previous errors
 *     await saveData();
 *   } catch (err) {
 *     setErrorFromCatch(err);
 *   }
 * };
 * 
 * return (
 *   <div>
 *     {hasError && <div className="error">{error}</div>}
 *     <button onClick={handleSave}>Save</button>
 *   </div>
 * );
 * ```
 */
export function useErrorState(
  options: UseErrorStateOptions = {}
): UseErrorStateReturn {
  const { initialError = null, autoClearMs } = options;
  
  const [error, setErrorState] = useState<string | null>(initialError);

  // Set error with optional auto-clear
  const setError = useCallback((errorMessage: string | null) => {
    setErrorState(errorMessage);
    
    if (errorMessage && autoClearMs) {
      setTimeout(() => {
        setErrorState(null);
      }, autoClearMs);
    }
  }, [autoClearMs]);

  // Clear error
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  // Set error from catch block
  const setErrorFromCatch = useCallback((error: unknown) => {
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unexpected error occurred';
    }
    
    setError(errorMessage);
  }, [setError]);

  const hasError = error !== null;

  return {
    error,
    hasError,
    setError,
    clearError,
    setErrorFromCatch,
  };
}