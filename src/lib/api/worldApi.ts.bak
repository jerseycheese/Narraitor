import { GeneratedWorldData } from '@/lib/generators/worldGenerator';

export interface GenerateWorldParams {
  worldReference?: string;
  worldRelationship?: 'inspired_by' | 'set_within';
  existingNames?: string[];
  suggestedName?: string;
}

export interface WorldImageParams {
  world: {
    id: string;
    name: string;
    description: string;
    genre: string;
  };
}

export interface WorldImageResponse {
  imageUrl: string;
  aiGenerated: boolean;
  prompt?: string;
}

/**
 * Centralized API service for all world-related operations
 */
export const worldApi = {
  /**
   * Generate a new world using AI
   */
  async generateWorld(params: GenerateWorldParams): Promise<GeneratedWorldData> {
    const response = await fetch('/api/generate-world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate world (${response.status})`);
    }

    return response.json();
  },

  /**
   * Generate an image for a world
   */
  async generateWorldImage(params: WorldImageParams): Promise<WorldImageResponse> {
    const response = await fetch('/api/generate-world-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate world image (${response.status})`);
    }

    return response.json();
  },

  
};
