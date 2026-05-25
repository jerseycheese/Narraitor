import { NextRequest, NextResponse } from 'next/server';
import type { JournalEntry } from '@/types/journal.types';
import type { World } from '@/types/world.types';
import Logger from '@/lib/utils/logger';
import { generateAndSaveImageWithGemini } from '@/lib/ai/geminiImageGenerator';
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
    logger.debug('generate-journal-image', 'Starting image generation for entry:', entry.id);

    const imagePrompt = customPrompt || generateImagePrompt(entry, world);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      logger.debug('generate-journal-image', 'No Gemini API key configured, using fallback');
      return NextResponse.json({
        imageUrl: generateFallbackImage(entry, world),
        prompt: imagePrompt,
        placeholder: true,
        aiGenerated: false,
      });
    }

    try {
      const savedImage = await generateAndSaveImageWithGemini(
        imagePrompt,
        apiKey,
        entry.id,
        'journals'
      );

      if (savedImage) {
        logger.debug(
          'generate-journal-image',
          `Gemini image saved successfully: ${savedImage.url} (${savedImage.fileSize} bytes)`
        );
        return NextResponse.json({
          imageUrl: savedImage.url,
          prompt: imagePrompt,
          placeholder: false,
          aiGenerated: true,
        });
      }

      logger.warn('generate-journal-image', 'Image generation failed, using fallback');
    } catch (imageGenError) {
      logger.error('generate-journal-image', 'Gemini image generation failed, using fallback:', imageGenError);
    }

    return NextResponse.json({
      imageUrl: generateFallbackImage(entry, world),
      prompt: imagePrompt,
      placeholder: true,
      aiGenerated: false,
    });
  } catch (error) {
    logger.error('generate-journal-image', 'Journal image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate journal image. Please try again.' },
      { status: 500 }
    );
  }
}
