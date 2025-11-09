import { NextRequest, NextResponse } from 'next/server';
import { categorizeInventoryItem } from '@/lib/ai/inventoryCategorizer';
import Logger from '@/lib/utils/logger';
import { getTimestamp } from '@/lib/utils';
import { handleAPIError, validateRequiredString } from '@/utils/apiHelpers';

const logger = new Logger('InventoryCategorizeAPI');

interface CategorizeInventoryRequest {
  name: string;
  description?: string;
  context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CategorizeInventoryRequest;

    const validationError = validateRequiredString(body.name, 'Item name');
    if (validationError) {
      return validationError;
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
    return handleAPIError(error, logger, 'InventoryCategorizeAPI', 'Failed to categorize inventory item');
  }
}
