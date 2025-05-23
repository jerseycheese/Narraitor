import { useState, useCallback } from 'react';

export interface AIAnalysisConfig<TInput, TOutput> {
  /**
   * Function to analyze input and generate suggestions
   */
  analyzeFunction: (input: TInput) => Promise<TOutput>;
  
  /**
   * Optional validation before analysis
   */
  validateInput?: (input: TInput) => { valid: boolean; message?: string };
  
  /**
   * Optional fallback suggestions if AI fails
   */
  fallbackSuggestions?: TOutput;
  
  /**
   * Optional callback on successful analysis
   */
  onSuccess?: (suggestions: TOutput) => void;
  
  /**
   * Optional callback on error
   */
  onError?: (error: Error) => void;
  
  /**
   * Debug mode for logging
   */
  debug?: boolean;
}

export interface AIAnalysisState<T> {
  suggestions: T | null;
  isProcessing: boolean;
  error: string | null;
}

export interface AIAnalysisHandlers<TInput> {
  analyze: (input: TInput) => Promise<void>;
  clearSuggestions: () => void;
  clearError: () => void;
}

/**
 * Generic hook for AI-powered analysis in wizards
 */
export function useWizardAI<TInput, TOutput>(
  config: AIAnalysisConfig<TInput, TOutput>
) {
  const { 
    analyzeFunction, 
    validateInput, 
    fallbackSuggestions,
    onSuccess,
    onError,
    debug = false 
  } = config;

  const [state, setState] = useState<AIAnalysisState<TOutput>>({
    suggestions: null,
    isProcessing: false,
    error: null,
  });

  const analyze = useCallback(async (input: TInput) => {
    // Validate input if validator provided
    if (validateInput) {
      const validation = validateInput(input);
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          error: validation.message || 'Invalid input for analysis',
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      if (debug) {
        console.log('[useWizardAI] Starting analysis with input:', input);
      }

      const suggestions = await analyzeFunction(input);
      
      if (debug) {
        console.log('[useWizardAI] Analysis complete, suggestions:', suggestions);
      }

      setState({
        suggestions,
        isProcessing: false,
        error: null,
      });

      if (onSuccess) {
        onSuccess(suggestions);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      
      if (debug) {
        console.error('[useWizardAI] Analysis error:', error);
      }

      setState({
        suggestions: fallbackSuggestions || null,
        isProcessing: false,
        error: errorMessage,
      });

      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [analyzeFunction, validateInput, fallbackSuggestions, onSuccess, onError, debug]);

  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const handlers: AIAnalysisHandlers<TInput> = {
    analyze,
    clearSuggestions,
    clearError,
  };

  return {
    ...state,
    ...handlers,
  };
}

/**
 * Example usage for world description analysis
 */
interface WorldAnalysisResult {
  attributes: Array<{ name: string; description: string }>;
  skills: Array<{ name: string; description: string }>;
}

export function useWorldDescriptionAI(
  analyzeWorldDescription: (description: string) => Promise<WorldAnalysisResult>,
  minDescriptionLength: number = 50
) {
  return useWizardAI({
    analyzeFunction: analyzeWorldDescription,
    validateInput: (description: string) => ({
      valid: description.length >= minDescriptionLength,
      message: `Description must be at least ${minDescriptionLength} characters`,
    }),
    fallbackSuggestions: {
      attributes: [],
      skills: [],
    },
    debug: process.env.NODE_ENV === 'development',
  });
}