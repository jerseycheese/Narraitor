/**
 * Client-side helper for AI-powered lore similarity checking
 * Mirrors the pattern from inventory similarity checking
 */

import Logger from '@/lib/utils/logger';
import type { LoreCategory } from '@/types/lore.types';
import { aiFetch } from '@/lib/ai/aiFetch';

const logger = new Logger('LoreSimilarityClient');

export interface LoreSimilarityResponse {
  similar: boolean;
  confidence: number;
  rationale?: string;
}

export interface LoreSimilarityRequest {
  name1: string;
  name2: string;
  category: LoreCategory;
}

/**
 * Check if two lore entity names refer to the same entity
 * Uses AI to handle complex cases like spelling variations, titles, nicknames
 */
export async function checkLoreSimilarityClient(
  payload: LoreSimilarityRequest
): Promise<LoreSimilarityResponse> {
  const response = await aiFetch('/api/lore/check-similarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    logger.warn('Lore similarity check failed', {
      status: response.status,
      details,
    });
    throw new Error(details?.error ?? 'Lore similarity check failed');
  }

  return (await response.json()) as LoreSimilarityResponse;
}
