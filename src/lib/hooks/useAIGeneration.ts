// src/lib/hooks/useAIGeneration.ts

import { useState, useCallback } from 'react';
import Logger from '@/lib/utils/logger';
import { formatPlainLanguageError } from '@/lib/utils/errorUtils';

const logger = new Logger('useAIGeneration');

interface AIGenerationState<T> {
  isGenerating: boolean;
  result: T | null;
  error: string | null;
}

interface AIGenerationOptions<TResponse> {
  endpoint: string;
  onSuccess?: (result: TResponse) => void;
  onError?: (error: string) => void;
  transform?: (response: unknown) => TResponse;
}

/**
 * Reusable hook for AI generation requests
 * Provides consistent loading states, error handling, and result management
 */
export function useAIGeneration<TRequest = Record<string, unknown>, TResponse = unknown>(
  options: AIGenerationOptions<TResponse>
) {
  const [state, setState] = useState<AIGenerationState<TResponse>>({
    isGenerating: false,
    result: null,
    error: null
  });

  const generate = useCallback(async (requestData: TRequest) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed with status ${response.status}`);
      }

      const data = await response.json();
      const result = options.transform ? options.transform(data) : data;
      
      setState(prev => ({ ...prev, result, isGenerating: false }));
      options.onSuccess?.(result);
      
      return result;
    } catch (error) {
      // Retain raw error details in console logs for debugging (#2042)
      logger.error(`Generation error at ${options.endpoint}:`, error);

      const plainLanguageError = formatPlainLanguageError(error);
      setState(prev => ({ ...prev, error: plainLanguageError, isGenerating: false }));
      options.onError?.(plainLanguageError);
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ isGenerating: false, result: null, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generate,
    reset,
    clearError
  };
}