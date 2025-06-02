import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import Logger from '@/lib/utils/logger';

const logger = new Logger('API');

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
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
    logger.error('generate-character API', 'Character generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate character',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}