'use client';

import { useInventoryStore, type InventoryItemAddPayload } from '@/state/inventoryStore';
import { getTimestamp } from '@/lib/utils';
import type {
  InventoryAcquisitionRecord,
  InventoryItemCategorization,
  InventoryCategorizationSource,
} from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';
import Logger from '@/lib/utils/logger';
import { categorizeInventoryItemClient } from './categorizeInventoryItemClient';

const logger = new Logger('InventoryService');

export interface AddInventoryItemRequest {
  name: string;
  description?: string;
  quantity?: number;
  stackable: boolean;
  maxStack?: number;
  acquisition?: Partial<InventoryAcquisitionRecord>;
  categorization?: InventoryItemCategorization;
  context?: Record<string, unknown>;
}

interface CategorizationPayload {
  categoryId: InventoryItemCategorization['categoryId'];
  confidence: number;
  rationale?: string;
  model?: string;
  source: InventoryCategorizationSource;
  classifiedAt: string;
}

function buildAcquisitionRecord(
  quantity: number,
  acquisition: Partial<InventoryAcquisitionRecord> | undefined,
  timestamp: string
): InventoryAcquisitionRecord {
  return {
    acquiredAt: acquisition?.acquiredAt ?? timestamp,
    method: acquisition?.method ?? 'manual',
    quantity: acquisition?.quantity ?? quantity,
    description: acquisition?.description,
    sourceId: acquisition?.sourceId,
    sessionId: acquisition?.sessionId,
    recordedBy: acquisition?.recordedBy,
  };
}

function buildCategorization(
  existing: InventoryItemCategorization | undefined,
  fallback: CategorizationPayload,
  timestamp: string
): InventoryItemCategorization {
  if (existing) {
    return {
      ...existing,
      classifiedAt: existing.classifiedAt ?? timestamp,
    };
  }

  return {
    categoryId: fallback.categoryId,
    confidence: fallback.confidence,
    rationale: fallback.rationale,
    source: fallback.source,
    model: fallback.model,
    classifiedAt: fallback.classifiedAt ?? timestamp,
  };
}

export async function addItemToInventory(
  characterId: EntityID,
  item: AddInventoryItemRequest
): Promise<EntityID> {
  const store = useInventoryStore.getState();
  const timestamp = getTimestamp();
  const quantity = item.quantity ?? item.acquisition?.quantity ?? 1;

  let categorizationResult: CategorizationPayload | undefined;

  if (!item.categorization) {
    try {
      const aiResult = await categorizeInventoryItemClient({
        name: item.name,
        description: item.description,
        context: item.context,
      });

      categorizationResult = {
        categoryId: aiResult.categoryId,
        confidence: aiResult.confidence,
        rationale: aiResult.rationale,
        model: aiResult.model,
        source: aiResult.source,
        classifiedAt: aiResult.classifiedAt,
      };
    } catch (error) {
      logger.warn('Falling back to default inventory category', error);
      categorizationResult = {
        categoryId: 'miscellaneous',
        confidence: 0.3,
        source: 'fallback',
        classifiedAt: timestamp,
      };
    }
  }

  const payload: InventoryItemAddPayload = {
    name: item.name,
    description: item.description,
    quantity,
    stackable: item.stackable,
    maxStack: item.maxStack,
    acquisition: buildAcquisitionRecord(quantity, item.acquisition, timestamp),
    categorization: buildCategorization(
      item.categorization,
      categorizationResult ?? {
        categoryId: 'miscellaneous',
        confidence: 0.35,
        source: 'fallback',
        classifiedAt: timestamp,
      },
      timestamp
    ),
  };

  return store.addItem(characterId, payload);
}
