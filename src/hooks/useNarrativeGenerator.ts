import { useMemo } from 'react';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

/**
 * Environment-aware NarrativeGenerator instance for components.
 * createDefaultGeminiClient branches on browser vs server internally; keeping
 * the construction here means components never import lib/ai directly.
 */
export function useNarrativeGenerator(): NarrativeGenerator {
  return useMemo(() => new NarrativeGenerator(createDefaultGeminiClient()), []);
}
