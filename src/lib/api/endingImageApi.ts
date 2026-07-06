import type { World } from '@/types/world.types';
import type { Character } from '@/state/characterStore';
import type { StoryEnding } from '@/types/narrative.types';
import { aiFetch } from '@/lib/ai/aiFetch';

export interface EndingImageParams {
  ending: StoryEnding;
  world?: World;
  character?: Character;
  recentNarrative: string[];
}

/**
 * Request the AI-generated ending illustration (worldApi pattern) —
 * components call this instead of hand-rolling the fetch + error handling.
 */
export async function generateEndingImage(params: EndingImageParams): Promise<{ imageUrl: string }> {
  const response = await aiFetch('/api/generate-ending-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to load ending image');
  }

  return response.json();
}
