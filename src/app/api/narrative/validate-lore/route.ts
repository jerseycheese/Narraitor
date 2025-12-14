import { NextRequest, NextResponse } from 'next/server';
import { validateLoreConsistency } from '@/lib/ai/loreConsistencyValidator';
import type { LoreValidationContext } from '@/types/lore.types';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint for validating narrative content against established lore
 * POST /api/narrative/validate-lore
 *
 * Follows fail-open architecture: errors return 200 with validated:false
 * rather than blocking the request with error codes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, context } = body as {
      content: string;
      context: LoreValidationContext;
    };

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { error: 'context is required and must be an object' },
        { status: 400 }
      );
    }

    // Validate context structure
    if (!Array.isArray(context.characters) ||
        !Array.isArray(context.worldRules) ||
        !Array.isArray(context.historicalEvents) ||
        !Array.isArray(context.locations)) {
      return NextResponse.json(
        { error: 'context must contain characters, worldRules, historicalEvents, and locations arrays' },
        { status: 400 }
      );
    }

    // Call validation engine
    const result = await validateLoreConsistency(content, context);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('LoreValidationAPI', 'Validation error', { error });

    // Fail-open: Return success response with validated:false
    // rather than blocking with an error
    return NextResponse.json({
      isConsistent: true,
      contradictions: [],
      severity: 'none',
      confidence: 'low',
      processingTime: 0,
      validated: false,
    });
  }
}
