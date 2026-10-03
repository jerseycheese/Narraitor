// src/lib/hooks/usePortraitGeneration.ts

import { useState, useCallback } from 'react';
import Logger from '@/lib/utils/logger';
import { formatPlainLanguageError } from '@/lib/utils/errorUtils';
import { generatePortrait } from '@/lib/api/generatePortrait';
import type { GeneratedImage } from '@/types/common.types';
import type { PortraitRequest } from '@/lib/api/generatePortrait';

const logger = new Logger('usePortraitGeneration');

/**
 * Hook for generating character portraits in the creation wizard.
 * Routes requests through the shared generatePortrait() API function,
 * ensuring player provider keys and world image pruning are handled consistently.
 */
export function usePortraitGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (requestData: PortraitRequest): Promise<GeneratedImage | undefined> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await generatePortrait(requestData);
        setIsGenerating(false);
        return response.portrait;
      } catch (err) {
        logger.error('Failed to generate portrait:', err);
        const plainLanguageError = formatPlainLanguageError(err);
        setError(plainLanguageError);
        setIsGenerating(false);
        throw err;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    generate,
    clearError,
  };
}
