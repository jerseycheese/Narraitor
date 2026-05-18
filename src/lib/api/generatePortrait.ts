import type { GeneratedImage } from '@/types/common.types';

export interface PortraitRequest {
  character?: unknown;
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
  const response = await fetch('/api/generate-portrait', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
