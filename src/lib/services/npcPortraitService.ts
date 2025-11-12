// src/lib/services/npcPortraitService.ts

import { World } from '@/types/world.types';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';
import Logger from '@/lib/utils/logger';

const logger = new Logger('NPCPortraitService');

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Service for generating AI portraits for NPCs
 * Reuses the existing /api/generate-portrait endpoint by adapting NPC data to Character format
 */
class NPCPortraitService {
  private cache: Map<string, Promise<string>> = new Map();
  private readonly RATE_LIMIT_DELAY_MS = 1500;

  /**
   * Generate a portrait for an NPC
   * @param npcId The NPC ID
   * @param world The world the NPC belongs to
   * @returns Promise that resolves to the portrait URL
   */
  async generateForNPC(npcId: string, world: World): Promise<string> {
    // Check cache first
    const cached = this.cache.get(npcId);
    if (cached) {
      logger.debug('generateForNPC', `Using cached portrait for NPC: ${npcId}`);
      return cached;
    }

    // Get NPC data from store
    const npcStore = useNPCStore.getState();
    const npc = npcStore.npcs[npcId];

    if (!npc) {
      const error = new Error(`NPC not found: ${npcId}`);
      logger.error('generateForNPC', 'NPC not found', { npcId });
      throw error;
    }

    // Create promise and cache it immediately to prevent duplicate requests
    const portraitPromise = this._generatePortraitInternal(npc.name, npc.description, world);
    this.cache.set(npcId, portraitPromise);

    try {
      const portraitUrl = await portraitPromise;

      // Update NPC with portrait URL
      npcStore.updateNPC(npcId, { avatarUrl: portraitUrl });

      logger.info('generateForNPC', `Portrait generated for NPC: ${npc.name}`, {
        npcId,
        portraitUrl
      });

      return portraitUrl;
    } catch (error) {
      // Remove from cache on error so it can be retried
      this.cache.delete(npcId);
      throw error;
    }
  }

  /**
   * Internal method to generate portrait by calling the API
   */
  private async _generatePortraitInternal(
    npcName: string,
    npcDescription: string,
    world: World
  ): Promise<string> {
    // Build request payload that adapts NPC to Character format
    const payload = {
      character: {
        name: npcName,
        background: {
          physicalDescription: npcDescription
        }
      },
      customDescription: npcDescription,
      world: {
        genre: world.genre,
        toneSettings: world.toneSettings
      }
    };

    logger.debug('_generatePortraitInternal', 'Calling /api/generate-portrait', {
      npcName,
      genre: world.genre
    });

    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Portrait generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract portrait URL from response
    const portraitUrl = data.portrait?.url || data.image;

    if (!portraitUrl) {
      throw new Error('Portrait URL not found in response');
    }

    return portraitUrl;
  }

  /**
   * Bootstrap portrait generation for all NPCs in a world that don't have portraits
   * @param worldId The world ID to scan for NPCs
   */
  async bootstrapNpcPortraits(worldId: string): Promise<void> {
    const worldStore = useWorldStore.getState();
    const world = worldStore.worlds[worldId];

    if (!world) {
      logger.warn('bootstrapNpcPortraits', `World not found: ${worldId}`);
      return;
    }

    const npcStore = useNPCStore.getState();
    const npcs = Object.values(npcStore.npcs).filter(
      npc => npc.worldId === worldId && !npc.avatarUrl
    );

    if (npcs.length === 0) {
      logger.debug('bootstrapNpcPortraits', `No NPCs need portraits in world: ${worldId}`);
      return;
    }

    logger.info('bootstrapNpcPortraits', `Generating portraits for ${npcs.length} NPCs`, {
      worldId,
      npcCount: npcs.length
    });

    // Generate portraits with rate limiting
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];

      try {
        await this.generateForNPC(npc.id, world);

        // Add delay between requests (except after last one)
        if (i < npcs.length - 1) {
          await delay(this.RATE_LIMIT_DELAY_MS);
        }
      } catch (error) {
        logger.warn('bootstrapNpcPortraits', `Failed to generate portrait for NPC: ${npc.name}`, {
          npcId: npc.id,
          error
        });
        // Continue with next NPC even if this one fails
      }
    }

    logger.info('bootstrapNpcPortraits', 'Bootstrap complete', { worldId });
  }

  /**
   * Clear the in-memory cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const npcPortraitService = new NPCPortraitService();
