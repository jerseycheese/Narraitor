import { useState, useMemo, useCallback } from 'react';

export interface TextAnalysisHookProps<T> {
  /** Function to analyze the text and return results */
  analyzer: (text: string) => T[];
  /** Dependencies for the analyzer function */
  analyzerDeps?: React.DependencyList;
}

export interface TextAnalysisResult<T> {
  /** Current text value */
  text: string;
  /** Function to update the text */
  setText: (text: string) => void;
  /** Analysis results */
  results: T[];
  /** Whether analysis is in progress (when debounced) */
  isAnalyzing: boolean;
  /** Clear all text and results */
  clear: () => void;
}

/**
 * Custom hook for text analysis with debouncing
 * Provides a reusable pattern for analyzing text input in real-time
 * 
 * @example
 * ```tsx
 * const { text, setText, results } = useTextAnalysis({
 *   analyzer: (text) => detectSkillActions(text),
 *   analyzerDeps: [character]
 * });
 * ```
 */
export function useTextAnalysis<T>({
  analyzer,
  analyzerDeps = []
}: TextAnalysisHookProps<T>): TextAnalysisResult<T> {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Memoized analyzer to prevent unnecessary re-creation
  const memoizedAnalyzer = useCallback(
    (text: string) => {
      if (!text.trim()) return [];
      return analyzer(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyzer, ...analyzerDeps]
  );

  // Immediate analysis results (non-debounced for real-time feedback)
  const results = useMemo(() => {
    return memoizedAnalyzer(text);
  }, [text, memoizedAnalyzer]);

  const clear = useCallback(() => {
    setText('');
    setIsAnalyzing(false);
  }, []);

  return {
    text,
    setText,
    results,
    isAnalyzing,
    clear
  };
}