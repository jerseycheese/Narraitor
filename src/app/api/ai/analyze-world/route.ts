import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderCredential } from '@/lib/ai/resolveApiKey';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import Logger from '@/lib/utils/logger';
import { reportServerError } from '@/lib/telemetry/reportServerError';
import { withAIRoute } from '@/utils/apiHelpers';

const logger = new Logger('API');

interface AnalyzeWorldRequest {
  description: string;
}

export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    logger.debug('analyze-world API', 'Request received');
    const body = await request.json() as AnalyzeWorldRequest;
    logger.debug('analyze-world API', 'Request body parsed');
    
    if (!body.description?.trim()) {
      logger.debug('analyze-world API', 'Validation failed: missing description');
      return NextResponse.json(
        { error: 'World description is required' },
        { status: 400 }
      );
    }

    logger.debug('analyze-world API', 'Analyzing world description...');

    // Analyze the world description using the AI service
    const analysis = await analyzeWorldDescription(
      body.description,
      resolveProviderCredential(request)
    );
    
    logger.debug('analyze-world API', 'Analysis completed successfully');

    return NextResponse.json(analysis);

  } catch (error) {
    logger.error('analyze-world API', 'World analysis failed:', error);
    reportServerError(error, { source: 'route', route: '/api/ai/analyze-world' });
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze world description',
      },
      { status: 500 }
    );
  }
});
