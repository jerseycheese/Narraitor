import { NextRequest, NextResponse } from 'next/server';
import { categorizeInventoryItems } from '@/lib/ai/inventoryCategorizer';
import Logger from '@/lib/utils/logger';
import { getTimestamp } from '@/lib/utils';

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
    const validItems = items.filter(
      (item) => item?.name && item.name.trim().length > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one item name is required for categorization' },
        { status: 400 }
      );
    }

    const categorizations = await categorizeInventoryItems(
      validItems.map((item) => ({
        name: item.name,
        description: item.description,
        context: item.context,
      }))
    );

    const classifiedAt = getTimestamp();

    return NextResponse.json({
      results: categorizations.map((result) => ({
        categoryId: result.categoryId,
        confidence: result.confidence,
        rationale: result.rationale,
        source: result.source,
        model: result.model,
        classifiedAt,
      })),
    });
  } catch (error) {
    logger.error('Failed to categorize inventory items', error);
    return NextResponse.json(
      {
        error: 'Failed to categorize inventory items',
      },
      { status: 500 }
    );
  }
}
