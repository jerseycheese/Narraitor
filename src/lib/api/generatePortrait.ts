import type { GeneratedImage } from '@/types/common.types';
import type { PortraitSubject } from '@/types/character.types';
import { aiFetch } from '@/lib/ai/aiFetch';

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
  const worldPayload =
    payload.world && typeof payload.world === 'object' && 'image' in payload.world
      ? (({ image: _image, ...rest }: Record<string, unknown>) => rest)(
          payload.world as Record<string, unknown>
        )
      : payload.world;
  const body = payload.world !== undefined ? { ...payload, world: worldPayload } : payload;

  const response = await aiFetch('/api/generate-portrait', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
