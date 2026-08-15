import { NextRequest, NextResponse } from 'next/server';
import type { JournalEntry } from '@/types/journal.types';
import type { World } from '@/types/world.types';
import Logger from '@/lib/utils/logger';
import { resolveGeneratedImageUrl } from '@/lib/api/imageGenerationHelpers';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';
import { getGenreStyleGuidance, getGenreFallbackImage } from '@/lib/utils/genrePromptGuide';

const logger = new Logger('JournalImageAPI');

// Cap how much entry text we feed into the prompt to keep generation focused.
const MAX_CONTENT_CHARS = 600;

interface GenerateJournalImageRequest {
  entry: JournalEntry;
  world?: World;
  customPrompt?: string;
}

// Build a scene prompt from the entry's narrative content.
function generateImagePrompt(entry: JournalEntry, world?: World): string {
  const genre = world?.genre?.toLowerCase() || 'fantasy';
  const sceneText = (entry.detailedContent || entry.content || '').slice(0, MAX_CONTENT_CHARS);
  const styleGuidance = getGenreStyleGuidance(genre, 'landscape');

  return `Create a highly detailed, cinematic illustration capturing this moment from a story journal${
    world ? ` set in the world "${world.name}"` : ''
  }. Genre: ${genre}.

Scene: ${entry.title ? `${entry.title}. ` : ''}${sceneText}

${styleGuidance}

Requirements:
- Ultra-high quality concept art illustrating the described moment
- Cinematic composition with dramatic, atmospheric lighting
- Rich detail and environmental storytelling
- Professional game/film concept art style
- Landscape orientation (16:9 or similar)
- No text, logos, or watermarks
- Colors and mood appropriate to the scene and ${genre} genre`;
}

function generateFallbackImage(entry: JournalEntry, world?: World): string {
  const genre = world?.genre || 'fantasy';
  return getGenreFallbackImage(genre, `journal-${entry.id}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateJournalImageRequest;

    if (!body.entry) {
      return NextResponse.json(
        { error: 'Journal entry data is required' },
        { status: 400 }
      );
    }

    const { entry, world, customPrompt } = body;
    logger.debug('generate-journal-image', 'Starting image generation');

    const imagePrompt = customPrompt || generateImagePrompt(entry, world);

    const { url: imageUrl, aiGenerated } = await resolveGeneratedImageUrl({
      prompt: imagePrompt,
      apiKey: resolveApiKey(request),
      fallbackUrl: generateFallbackImage(entry, world),
      loggerContext: 'generate-journal-image',
      onHardFailure: 'fallback',
    });

    return NextResponse.json({
      imageUrl,
      prompt: imagePrompt,
      placeholder: !aiGenerated,
      aiGenerated,
    });
  } catch (error) {
    logger.error('generate-journal-image', 'Journal image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate journal image. Please try again.' },
      { status: 500 }
    );
  }
}
