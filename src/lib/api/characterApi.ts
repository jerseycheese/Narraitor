import type { GeneratedCharacterData } from '@/lib/generators/characterGenerator';
import type { World } from '@/types/world.types';
import { aiFetch } from '@/lib/ai/aiFetch';

export interface GenerateCharacterParams {
  worldId?: string;
  characterType: 'known' | 'original' | 'specific';
  existingNames: string[];
  suggestedName?: string;
  world?: World | null;
  concept?: string;
}

/**
 * Centralized API service for character generation (worldApi pattern) —
 * components call this instead of hand-rolling the fetch + error handling.
 */
export const characterApi = {
  async generateCharacter(params: GenerateCharacterParams): Promise<GeneratedCharacterData> {
    const { world, ...restParams } = params;
    const worldPayload =
      world && 'image' in world
        ? (({ image: _image, ...rest }) => rest)(world)
        : world;
    const body = world !== undefined ? { ...restParams, world: worldPayload } : restParams;

    const response = await aiFetch('/api/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || 'Failed to generate character');
    }

    return response.json();
  },
};
