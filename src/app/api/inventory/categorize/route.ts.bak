import { NextRequest, NextResponse } from 'next/server';
import { categorizeInventoryItem } from '@/lib/ai/inventoryCategorizer';
import Logger from '@/lib/utils/logger';
import { getTimestamp } from '@/lib/utils';

const logger = new Logger('InventoryCategorizeAPI');

interface CategorizeInventoryRequest {
  name: string;
  description?: string;
  context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CategorizeInventoryRequest;

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Item name is required for categorization' },
        { status: 400 }
      );
    }

    const result = await categorizeInventoryItem({
      name: body.name,
      description: body.description,
      context: body.context,
    });

    const classifiedAt = getTimestamp();

    return NextResponse.json({
      categoryId: result.categoryId,
      confidence: result.confidence,
      rationale: result.rationale,
      source: result.source,
      model: result.model,
      classifiedAt,
    });
  } catch (error) {
    logger.error('Failed to categorize inventory item', error);
    return NextResponse.json(
      {
        error: 'Failed to categorize inventory item',
      },
      { status: 500 }
    );
  }
}
