import { NextRequest, NextResponse } from 'next/server';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import Logger from '@/lib/utils/logger';
import { handleAPIError, validateRequiredString } from '@/utils/apiHelpers';

const logger = new Logger('API');

interface AnalyzeWorldRequest {
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('analyze-world API', 'Request received');
    const body = await request.json() as AnalyzeWorldRequest;
    logger.debug('analyze-world API', 'Request body parsed');

    const validationError = validateRequiredString(body.description, 'World description');
    if (validationError) {
      logger.debug('analyze-world API', 'Validation failed: missing description');
      return validationError;
    }

    logger.debug('analyze-world API', 'Analyzing world description...');

    // Analyze the world description using the AI service
    const analysis = await analyzeWorldDescription(body.description);

    logger.debug('analyze-world API', 'Analysis completed successfully');

    return NextResponse.json(analysis);

  } catch (error) {
    return handleAPIError(error, logger, 'analyze-world API', 'Failed to analyze world description');
  }
}