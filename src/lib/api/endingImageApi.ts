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

/** The illustration plus the diagnostic fields the route reports alongside it. */
export interface EndingImageResult {
  imageUrl: string;
  prompt?: string;
  imageGenerationPrompt?: string;
  description?: string;
  tone?: string;
  aiGenerated?: boolean;
  placeholder?: boolean;
  service?: string;
}

/** What the route returns when asked for the prompt alone: no image, no image fields. */
export interface EndingImagePromptResult {
  prompt?: string;
  imageGenerationPrompt?: string;
  description?: string;
}

async function postEndingImage(body: Record<string, unknown>) {
  const response = await aiFetch('/api/generate-ending-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Failed to load ending image (${response.status})`
    );
  }

  return response.json();
}

/**
 * Request the AI-generated ending illustration (worldApi pattern) —
 * components call this instead of hand-rolling the fetch + error handling.
 */
export async function generateEndingImage(
  params: EndingImageParams
): Promise<EndingImageResult> {
  return postEndingImage({ ...params });
}

/**
 * Ask the route for the prompt it would send to the image model and stop there,
 * skipping the image generation itself.
 */
export async function generateEndingImagePrompt(
  params: EndingImageParams
): Promise<EndingImagePromptResult> {
  return postEndingImage({ ...params, promptOnly: true });
}
