import { NextRequest, NextResponse } from 'next/server';
import { TemplateGenerator } from '@/lib/ai/templateGenerator';
import { TemplateGenerationContext } from '@/lib/ai/templatePrompts';
import { geminiClient } from '@/lib/ai/geminiClient';
import Logger from '@/lib/utils/logger';

const logger = new Logger('API');

interface GenerateTemplateRequest {
  type: 'inspired-by' | 'genre-mix' | 'surprise-me';
  userInput?: string;
  genres?: string[];
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('generate-template API', 'Request received');
    const body = await request.json() as GenerateTemplateRequest;
    logger.debug('generate-template API', 'Request body parsed:', JSON.stringify(body));
    
    // Validate request
    if (!body.type) {
      logger.debug('generate-template API', 'Validation failed: missing type');
      return NextResponse.json(
        { error: 'Template generation type is required' },
        { status: 400 }
      );
    }

    if (body.type === 'inspired-by' && !body.userInput?.trim()) {
      logger.debug('generate-template API', 'Validation failed: inspired-by without userInput');
      return NextResponse.json(
        { error: 'User input is required for inspired-by generation' },
        { status: 400 }
      );
    }

    if (body.type === 'genre-mix' && (!body.genres || body.genres.length < 2)) {
      logger.debug('generate-template API', 'Validation failed: genre-mix without enough genres');
      return NextResponse.json(
        { error: 'At least 2 genres are required for genre-mix generation' },
        { status: 400 }
      );
    }

    logger.debug('generate-template API', 'Generating template for type:', body.type);

    // Create generation context
    const context: TemplateGenerationContext = {
      type: body.type,
      userInput: body.userInput,
      genres: body.genres
    };

    // Generate the template using the secure server-side client
    const templateGenerator = new TemplateGenerator(geminiClient);
    const template = await templateGenerator.generateWorldTemplate(context);
    
    logger.debug('generate-template API', 'Template generated:', template.name);

    return NextResponse.json(template);

  } catch (error) {
    logger.error('generate-template API', 'Template generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}