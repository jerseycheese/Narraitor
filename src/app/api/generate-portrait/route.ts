// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import { PortraitSubject } from '@/types/character.types';
import { World } from '@/types/world.types';
import { truncate, getTimestamp } from '@/lib/utils';
import { resolveGeneratedImageUrl } from '@/lib/api/imageGenerationHelpers';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';
import { withAIRoute } from '@/utils/apiHelpers';

const logger = new Logger('API');

/**
 * Single function to build portrait prompts with AI-powered actor detection
 */
async function buildPortraitPrompt(
  characterName: string,
  physicalDescription: string,
  worldGenre: string,
  isKnownFigure?: boolean,
  apiKey?: string | null
): Promise<string> {
  try {
    logger.debug(
      'generate-portrait API',
      'Starting AI character detection for:',
      characterName
    );

    // Use only the character detection part, not the full image generation.
    // These two dynamic imports are independent, so load them in parallel
    // rather than awaiting one after the other.
    const [
      { buildPortraitPrompt: buildPortraitPromptFn },
      { createDefaultGeminiClient },
    ] = await Promise.all([
      import('@/lib/ai/portraitGenerator'),
      import('@/lib/ai/defaultGeminiClient'),
    ]);

    logger.debug('generate-portrait API', 'Creating AI client and generator');
    const aiClient = createDefaultGeminiClient(apiKey);

    logger.debug(
      'generate-portrait API',
      'Calling buildPortraitPrompt directly to avoid image generation'
    );

    // Call buildPortraitPrompt directly to avoid the image generation requirement
    const prompt = await buildPortraitPromptFn(
      aiClient,
      {
        name: characterName,
        background: { physicalDescription },
      },
      {
        worldGenre: worldGenre,
      }
    );

    logger.debug(
      'generate-portrait API',
      'AI detection successful, prompt:',
      truncate(prompt, 100)
    );
    return prompt;
  } catch (error) {
    logger.debug(
      'generate-portrait API',
      'AI detection failed, using fallback. Error:',
      error
    );

    // Fallback to basic prompt if AI detection fails
    return `Create a professional portrait of ${characterName}, ${physicalDescription}. ${isKnownFigure ? `This should be recognizable as ${characterName} from the source material.` : 'This is an original character.'} Style: realistic portrait, professional lighting, clear facial features, suitable for a character profile. Setting genre: ${worldGenre}.`;
  }
}

export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    logger.debug(
      'generate-portrait API',
      'Request body keys:',
      Object.keys(body)
    );
    logger.debug(
      'generate-portrait API',
      'Request body:',
      JSON.stringify(body, null, 2)
    );

    // Handle different input formats
    let prompt: string;
    let character: PortraitSubject | undefined;
    let world: World | undefined;
    const apiKey = resolveApiKey(request);

    if (typeof body === 'string') {
      prompt = body;
    } else if (body.prompt) {
      // Direct prompt format
      prompt = body.prompt;
    } else if (body.character) {
      // Character + world format - need to build prompt
      character = body.character;
      world = body.world;
      const customDescription = body.customDescription;
      const promptOnly = body.promptOnly;

      logger.debug(
        'generate-portrait API',
        'Character format detected, promptOnly:',
        promptOnly
      );

      if (promptOnly) {
        logger.debug('generate-portrait API', 'Using promptOnly mode');

        const characterName = character?.name || 'Unknown';
        const physicalDesc =
          customDescription || character?.background?.physicalDescription || '';
        const worldGenre = world?.genre || 'modern';
        const isKnownFigure = character?.background?.isKnownFigure;

        const prompt = await buildPortraitPrompt(
          characterName,
          physicalDesc,
          worldGenre,
          isKnownFigure,
          apiKey
        );

        return NextResponse.json({
          prompt: prompt,
          promptOnly: true,
        });
      } else {
        // Build a prompt for actual image generation
        const characterName = character?.name || 'character';
        const physicalDesc =
          customDescription ||
          character?.background?.physicalDescription ||
          'No specific appearance described';
        const worldGenre = world?.genre || 'fantasy';
        const isKnownFigure = character?.background?.isKnownFigure;

        prompt = await buildPortraitPrompt(
          characterName,
          physicalDesc,
          worldGenre,
          isKnownFigure,
          apiKey
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either prompt string or character object is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt could not be determined from input' },
        { status: 400 }
      );
    }

    logger.debug(
      'generate-portrait API',
      'Generating portrait with prompt:',
      truncate(prompt, 100)
    );

    const { url } = await resolveGeneratedImageUrl({
      prompt,
      apiKey,
      fallbackUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character?.name || 'unknown')}`,
      loggerContext: 'generate-portrait API',
      onHardFailure: 'throw',
    });

    // Portraits are typed 'ai-generated' even when the URL is the dicebear
    // placeholder: CharacterPortrait only renders a portrait whose type isn't
    // 'placeholder', and the avatar is meant to show.
    return NextResponse.json({
      portrait: {
        type: 'ai-generated' as const,
        url,
        generatedAt: getTimestamp(),
        prompt: prompt,
      },
    });
  } catch (error) {
    logger.error('generate-portrait API', 'Portrait generation failed:', error);

    // Return mock portrait as fallback
    const fallbackPortrait = {
      type: 'ai-generated' as const,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(Math.random().toString())}`,
      generatedAt: getTimestamp(),
      prompt: 'Character portrait fallback',
    };

    return NextResponse.json({
      portrait: fallbackPortrait,
    });
  }
});
