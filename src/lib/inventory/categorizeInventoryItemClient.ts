import type { StandardInventoryCategory } from '@/types/inventory.types';
import Logger from '@/lib/utils/logger';

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

export async function categorizeInventoryItemClient(
  payload: CategorizeInventoryItemRequest
): Promise<InventoryCategorizationResponse> {
  const response = await fetch('/api/inventory/categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    logger.warn('Inventory categorization request failed', {
      status: response.status,
      details,
    });
    throw new Error(details?.error ?? 'Inventory categorization failed');
  }

  return (await response.json()) as InventoryCategorizationResponse;
}
