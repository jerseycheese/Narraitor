import React, { useState, useCallback, useRef } from 'react';

/**
 * Status of an async operation
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Configuration options for useAsyncState hook
 */
export interface UseAsyncStateOptions<T> {
  /** Initial data value */
  initialData?: T;
  /** Initial status */
  initialStatus?: AsyncStatus;
  /** Auto-clear error after specified milliseconds */
  autoClearErrorMs?: number;
}

/**
 * Return type for useAsyncState hook
 */
export interface UseAsyncStateReturn<T> {
  /** Current data */
  data: T | undefined;
  /** Current error message */
  error: string | null;
  /** Current status */
  status: AsyncStatus;
  /** Whether the operation is currently loading */
  isLoading: boolean;
  /** Whether the operation resulted in an error */
  isError: boolean;
  /** Whether the operation completed successfully */
  isSuccess: boolean;
  /** Whether the operation is in initial/idle state */
  isIdle: boolean;
  /** Execute an async operation */
  execute: <R = T>(asyncFn: () => Promise<R>) => Promise<R | undefined>;
  /** Set data directly */
  setData: (data: T) => void;
  /** Set error directly */
  setError: (error: string | null) => void;
  /** Clear error */
  clearError: () => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Custom hook for managing async operation state
 * 
 * This hook abstracts the common pattern of:
 * - Loading state management
 * - Error state management  
 * - Data state management
 * - Status tracking for async operations
 * 
 * @param options Configuration options for async state
 * @returns Async state management object
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, execute } = useAsyncState<User>();
 * 
 * const handleLoadUser = async () => {
 *   await execute(async () => {
 *     const response = await fetch('/api/user');
 *     if (!response.ok) throw new Error('Failed to load user');
 *     return response.json();
 *   });
 * };
 * 
 * return (
 *   <div>
 *     {isLoading && <div>Loading...</div>}
 *     {isError && <div>Error: {error}</div>}
 *     {data && <div>User: {data.name}</div>}
 *     <button onClick={handleLoadUser}>Load User</button>
 *   </div>
 * );
 * ```
 */
export function useAsyncState<T = unknown>(
  options: UseAsyncStateOptions<T> = {}
): UseAsyncStateReturn<T> {
  const { 
    initialData, 
    initialStatus = 'idle', 
    autoClearErrorMs 
  } = options;

  const [data, setDataState] = useState<T | undefined>(initialData);
  const [error, setErrorState] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncStatus>(initialStatus);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Set data
  const setData = useCallback((newData: T) => {
    if (!isMountedRef.current) return;
    setDataState(newData);
    setStatus('success');
    setErrorState(null);
  }, []);

  // Set error with optional auto-clear
  const setError = useCallback((errorMessage: string | null) => {
    if (!isMountedRef.current) return;
    setErrorState(errorMessage);
    setStatus(errorMessage ? 'error' : 'idle');
    
    if (errorMessage && autoClearErrorMs) {
      setTimeout(() => {
        if (isMountedRef.current) {
          setErrorState(null);
          setStatus('idle');
        }
      }, autoClearErrorMs);
    }
  }, [autoClearErrorMs]);

  // Clear error
  const clearError = useCallback(() => {
    if (!isMountedRef.current) return;
    setErrorState(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    setDataState(initialData);
    setErrorState(null);
    setStatus(initialStatus);
  }, [initialData, initialStatus]);

  // Execute async operation
  const execute = useCallback(async <R = T>(
    asyncFn: () => Promise<R>
  ): Promise<R | undefined> => {
    if (!isMountedRef.current) return;
    
    try {
      setStatus('loading');
      setErrorState(null);
      
      const result = await asyncFn();
      
      if (!isMountedRef.current) return;
      
      setDataState(result as unknown as T);
      setStatus('success');
      return result;
    } catch (err) {
      if (!isMountedRef.current) return;
      
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setErrorState(errorMessage);
      setStatus('error');
      return undefined;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Computed state
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isSuccess = status === 'success';
  const isIdle = status === 'idle';

  return {
    data,
    error,
    status,
    isLoading,
    isError,
    isSuccess,
    isIdle,
    execute,
    setData,
    setError,
    clearError,
    reset,
  };
}