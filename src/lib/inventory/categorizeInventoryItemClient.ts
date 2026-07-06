import type { StandardInventoryCategory } from '@/types/inventory.types';
import Logger from '@/lib/utils/logger';
import { aiFetch } from '@/lib/ai/aiFetch';

const logger = new Logger('InventoryCategorizeClient');

export interface InventoryCategorizationResponse {
  categoryId: StandardInventoryCategory;
  confidence: number;
  rationale?: string;
  source: 'ai' | 'fallback';
  model?: string;
  classifiedAt: string;
}

export interface CategorizeInventoryItemRequest {
  name: string;
  description?: string;
  context?: Record<string, unknown>;
}

/**
 * Categorizes one or more inventory items in a single API call. Batching avoids
 * firing N sequential categorization requests when a narrative segment yields
 * multiple items without category hints. Responses are returned in input order.
 */
export async function categorizeInventoryItemsClient(
  items: CategorizeInventoryItemRequest[]
): Promise<InventoryCategorizationResponse[]> {
  if (items.length === 0) {
    return [];
  }

  const response = await aiFetch('/api/inventory/categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    logger.warn('Inventory categorization request failed', {
      status: response.status,
      count: items.length,
      details,
    });
    throw new Error(details?.error ?? 'Inventory categorization failed');
  }

  const data = (await response.json()) as {
    results?: InventoryCategorizationResponse[];
  };
  return data.results ?? [];
}
