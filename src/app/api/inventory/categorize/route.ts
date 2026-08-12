import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';
import { resolveModel } from '@/lib/ai/resolveModel';
import { categorizeInventoryItems } from '@/lib/ai/inventoryCategorizer';
import type { InventoryCategorizationResult } from '@/lib/ai/inventoryCategorizer';
import Logger from '@/lib/utils/logger';
import { getTimestamp } from '@/lib/utils';
import { reportServerError } from '@/lib/telemetry/reportServerError';

const logger = new Logger('InventoryCategorizeAPI');

interface CategorizeInventoryItemPayload {
  name: string;
  description?: string;
  context?: Record<string, unknown>;
}

interface CategorizeInventoryRequest {
  items: CategorizeInventoryItemPayload[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CategorizeInventoryRequest;

    const items = Array.isArray(body.items) ? body.items : [];

    // Track original indexes so results map back 1:1 to the input order. The
    // caller consumes the response positionally, so dropping invalid items
    // without holding their slots would shift categories onto the wrong items.
    const validIndices: number[] = [];
    const validItems = items
      .filter((item, index) => {
        const isValid = Boolean(item?.name && item.name.trim().length > 0);
        if (isValid) {
          validIndices.push(index);
        }
        return isValid;
      })
      .map((item) => ({
        name: item.name,
        description: item.description,
        context: item.context,
      }));

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one item name is required for categorization' },
        { status: 400 }
      );
    }

    const categorizations = await categorizeInventoryItems(
      validItems,
      resolveApiKey(request),
      resolveModel(request)
    );
    const classifiedAt = getTimestamp();

    // Map each categorization back to its original input slot, then emit a
    // full-length, input-aligned array. Invalid slots get a fallback so
    // positional consumers never receive shifted categories.
    const byIndex = new Map<number, InventoryCategorizationResult>();
    validIndices.forEach((originalIndex, position) => {
      const result = categorizations[position];
      if (result) {
        byIndex.set(originalIndex, result);
      }
    });

    const results = items.map((_, index) => {
      const result = byIndex.get(index);
      return {
        categoryId: result ? result.categoryId : 'miscellaneous',
        confidence: result ? result.confidence : 0,
        rationale: result ? result.rationale : 'Item name missing or invalid',
        source: result ? result.source : 'fallback',
        model: result?.model,
        classifiedAt,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Failed to categorize inventory items', error);
    reportServerError(error, { source: 'route', route: '/api/inventory/categorize' });
    return NextResponse.json(
      {
        error: 'Failed to categorize inventory items',
      },
      { status: 500 }
    );
  }
}
