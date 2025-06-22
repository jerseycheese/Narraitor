// src/lib/hooks/useHistory.ts

import { useCallback } from 'react';

/**
 * Generic history management hook that can be reused across features
 */
export function useHistory<T>(
  history: T[],
  addToHistory: (entry: T) => void,
  clearHistory: () => void,
  maxItems: number = 5
) {
  const addEntry = useCallback((entry: T) => {
    addToHistory(entry);
  }, [addToHistory]);

  const clear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const getRecent = useCallback((count?: number) => {
    const itemCount = count || maxItems;
    return history.slice(0, itemCount);
  }, [history, maxItems]);

  const isEmpty = history.length === 0;
  const isFull = history.length >= maxItems;

  return {
    history,
    addEntry,
    clear,
    getRecent,
    isEmpty,
    isFull,
    count: history.length
  };
}