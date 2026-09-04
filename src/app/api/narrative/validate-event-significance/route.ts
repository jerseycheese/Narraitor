import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderCredential } from '@/lib/ai/resolveApiKey';
import { validateEventSignificance, ValidationContext } from '@/lib/ai/eventSignificanceValidator';
import { withAIRoute } from '@/utils/apiHelpers';

import Logger from '@/lib/utils/logger';
import { reportServerError } from '@/lib/telemetry/reportServerError';
const logger = new Logger('ValidateEventSignificance');

/**
 * API endpoint for validating event significance
 * POST /api/narrative/validate-event-significance
 */
export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { majorEvent, context } = body as {
      majorEvent: string;
      context?: ValidationContext;
    };

    if (!majorEvent || typeof majorEvent !== 'string') {
      return NextResponse.json(
        { error: 'majorEvent is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await validateEventSignificance(
      majorEvent,
      context,
      resolveProviderCredential(request)
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Event significance validation error:', error);
    reportServerError(error, { source: 'route', route: '/api/narrative/validate-event-significance' });
    return NextResponse.json(
      {
        error: 'Failed to validate event significance',
      },
      { status: 500 }
    );
  }
});
