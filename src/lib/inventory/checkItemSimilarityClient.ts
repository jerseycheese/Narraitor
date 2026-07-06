// src/lib/inventory/checkItemSimilarityClient.ts

import Logger from '@/lib/utils/logger';
import { aiFetch } from '@/lib/ai/aiFetch';

const logger = new Logger('ItemSimilarityClient');

export interface ItemSimilarityResponse {
  similar: boolean;
  confidence: number;
  rationale?: string;
}

export interface CheckItemSimilarityRequest {
  name1: string;
  name2: string;
}

/**
 * Client-side function to check if two item names refer to the same item.
 * Uses AI to handle complex cases like synonyms, word reordering, etc.
 */
export async function checkItemSimilarityClient(
  payload: CheckItemSimilarityRequest
): Promise<ItemSimilarityResponse> {
  const response = await aiFetch('/api/inventory/check-similarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    logger.warn('Item similarity check failed', {
      status: response.status,
      details,
    });
    throw new Error(details?.error ?? 'Item similarity check failed');
  }

  return (await response.json()) as ItemSimilarityResponse;
}
