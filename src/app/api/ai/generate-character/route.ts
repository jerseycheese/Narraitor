import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import Logger from '@/lib/utils/logger';
import { handleAPIError, validateRequiredString } from '@/utils/apiHelpers';

const logger = new Logger('API');

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const validationError = validateRequiredString(prompt, 'Prompt');
    if (validationError) {
      return validationError;
    }

    // Create AI client (server-side only)
    const client = createDefaultGeminiClient();

    logger.debug('generate-character API', 'Generating character with prompt length:', prompt.length);

    // Generate the character using AI
    const response = await client.generateContent(prompt);

    logger.debug('generate-character API', 'AI response received:', response.content.substring(0, 200) + '...');

    return NextResponse.json({
      content: response.content,
      finishReason: response.finishReason,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens
    });

  } catch (error) {
    return handleAPIError(error, logger, 'generate-character API', 'Failed to generate character');
  }
}
