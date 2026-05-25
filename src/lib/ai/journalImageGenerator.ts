// src/lib/ai/journalImageGenerator.ts

import { JournalEntry } from '@/types/journal.types';
import { World } from '@/types/world.types';
import { GeneratedImage } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('JournalImageGenerator');

/**
 * Request an AI-generated image for a journal entry and return it as a
 * GeneratedImage ready to store on the entry's metadata.
 */
export async function generateJournalImage(
  entry: JournalEntry,
  world?: World,
  customPrompt?: string
): Promise<GeneratedImage> {
  try {
    const response = await fetch('/api/generate-journal-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry, world, customPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate journal image');
    }

    const data = await response.json();

    return {
      type: data.aiGenerated ? 'ai-generated' : 'placeholder',
      url: data.imageUrl,
      generatedAt: getTimestamp(),
      prompt: data.prompt,
    };
  } catch (error) {
    logger.error('Journal image generation error:', error);
    throw error;
  }
}
