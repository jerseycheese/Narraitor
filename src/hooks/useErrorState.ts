import { useState, useCallback, useRef, useEffect } from 'react';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set error with optional auto-clear
  const setError = useCallback((errorMessage: string | null) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setErrorState(errorMessage);
    
    if (errorMessage && autoClearMs) {
      timeoutRef.current = setTimeout(() => {
        setErrorState(null);
        timeoutRef.current = null;
      }, autoClearMs);
    }
  }, [autoClearMs]);

  // Clear error
  const clearError = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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