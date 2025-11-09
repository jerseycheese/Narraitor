import { NextRequest, NextResponse } from 'next/server';
import { TemplateGenerator } from '@/lib/ai/templateGenerator';
import { TemplateGenerationContext } from '@/lib/ai/templatePrompts';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getAIConfig, getGenerationConfig, getSafetySettings } from '@/lib/ai/config';
import Logger from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errorUtils';


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

    if (body.type === 'genre-mix' && (!body.genres || (body.genres as unknown[]).length < 2)) {
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

    // Generate the template using the secure server-side client with timeout
    const aiConfig = getAIConfig();
    const client = new GeminiClient({
      apiKey: aiConfig.geminiApiKey,
      modelName: aiConfig.modelName,
      maxRetries: aiConfig.maxRetries,
      timeout: aiConfig.timeout,
      generationConfig: getGenerationConfig(),
      safetySettings: getSafetySettings()
    });
    const templateGenerator = new TemplateGenerator(client);
    
    // Add timeout wrapper to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Template generation timeout')), 45000)
    );
    
    const template = await Promise.race([
      templateGenerator.generateWorldTemplate(context),
      timeoutPromise
    ]);
    
    logger.debug('generate-template API', 'Template generated:', template && typeof template === 'object' && 'name' in template ? template.name : 'Unknown template');

    return NextResponse.json(template);

  } catch (error) {
    logger.error('generate-template API', 'Template generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate template',
        details: getErrorMessage(error, 'Unknown error')
      },
      { status: 500 }
    );
  }
}