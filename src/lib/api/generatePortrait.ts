import type { GeneratedImage } from '@/types/common.types';
import type { PortraitSubject } from '@/types/character.types';
import { aiFetch } from '@/lib/ai/aiFetch';
import { withoutWorldImage } from '@/lib/api/worldPayload';

export interface PortraitRequest {
  character?: PortraitSubject;
  world?: unknown;
  customDescription?: string;
  prompt?: string;
  promptOnly?: boolean;
}

export interface PortraitResponse {
  portrait?: GeneratedImage;
  prompt?: string;
}

export async function generatePortrait(
  payload: PortraitRequest
): Promise<PortraitResponse> {
  const response = await aiFetch('/api/generate-portrait', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, world: withoutWorldImage(payload.world) }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message =
      (errorPayload as { error?: string }).error ||
      `Portrait request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
