import { GeneratedWorldData } from '@/lib/generators/worldGenerator';
import { World } from '@/types/world.types';

export interface GenerateWorldParams {
  worldReference?: string;
  worldRelationship?: 'based_on' | 'set_in';
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

  /**
   * Generate a character for a world
   */
  async generateCharacter(params: {
    worldId: string;
    characterData?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const response = await fetch('/api/generate-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate character (${response.status})`);
    }

    return response.json();
  },

  /**
   * Generate a portrait for a character
   */
  async generatePortrait(params: {
    character: Record<string, unknown>;
    world: World;
  }): Promise<{ imageUrl: string }> {
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate portrait (${response.status})`);
    }

    return response.json();
  },
};

/**
 * Error types for better error handling
 */
export class WorldApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: string
  ) {
    super(message);
    this.name = 'WorldApiError';
  }
}

/**
 * Enhanced API service with better error handling
 */
export const enhancedWorldApi = {
  async generateWorld(params: GenerateWorldParams): Promise<GeneratedWorldData> {
    try {
      return await worldApi.generateWorld(params);
    } catch (error) {
      if (error instanceof Error) {
        throw new WorldApiError(
          `World generation failed: ${error.message}`,
          undefined,
          error.message
        );
      }
      throw new WorldApiError('Unknown error during world generation');
    }
  },

  async generateWorldImage(params: WorldImageParams): Promise<WorldImageResponse> {
    try {
      return await worldApi.generateWorldImage(params);
    } catch (error) {
      if (error instanceof Error) {
        throw new WorldApiError(
          `World image generation failed: ${error.message}`,
          undefined,
          error.message
        );
      }
      throw new WorldApiError('Unknown error during world image generation');
    }
  },

  // Add other methods with similar error handling...
};

/**
 * Type guards for API responses
 */
export function isGeneratedWorldData(data: unknown): data is GeneratedWorldData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.name === 'string' &&
    typeof obj.genre === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.attributes) &&
    Array.isArray(obj.skills) &&
    Boolean(obj.settings) &&
    typeof obj.settings === 'object'
  );
}
export function isWorldImageResponse(data: unknown): data is WorldImageResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.imageUrl === 'string' &&
    typeof obj.aiGenerated === 'boolean'
  );
}