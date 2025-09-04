// src/lib/hooks/useAsyncOperation.ts

import { useState, useCallback } from 'react';

interface AsyncOperationState<T> {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
  hasCompletedSuccessfully: boolean;
}

type AsyncFunction<T, TArgs extends readonly unknown[] = readonly unknown[]> = (
  ...args: TArgs
) => Promise<T>;

interface AsyncOperationOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

/**
 * Generic hook for managing the state of any asynchronous operation
 * Provides consistent loading states, error handling, and data management
 * 
 * @param asyncFunction The async function to execute
 * @param options Optional callbacks and initial data
 * @returns Object with execute function and state values
 */
export function useAsyncOperation<T, TArgs extends readonly unknown[] = readonly unknown[]>(
  asyncFunction: AsyncFunction<T, TArgs>,
  options: AsyncOperationOptions<T> = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    isLoading: false,
    data: options.initialData ?? null,
    error: null,
    hasCompletedSuccessfully: options.initialData !== undefined
  });

  const execute = useCallback(async (...args: TArgs): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      setState({ isLoading: false, data: result, error: null, hasCompletedSuccessfully: true });
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ isLoading: false, data: null, error: errorObj, hasCompletedSuccessfully: false });
      options.onError?.(errorObj);
      throw errorObj;
    }
  }, [asyncFunction, options]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: options.initialData ?? null,
      error: null,
      hasCompletedSuccessfully: options.initialData !== undefined
    });
  }, [options.initialData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    execute,
    reset,
    clearError,
    isLoading: state.isLoading,
    data: state.data,
    error: state.error,
    hasError: state.error !== null,
    hasData: state.hasCompletedSuccessfully
  };
}