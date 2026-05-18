// src/lib/services/npcPortraitService.ts

import { World } from '@/types/world.types';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';
import Logger from '@/lib/utils/logger';
import { ImageRequestCoordinator } from './imageRequestCoordinator';

const logger = new Logger('NPCPortraitService');

/**
 * Service for generating AI portraits for NPCs.
 * Reuses /api/generate-portrait by adapting NPC data to Character format.
 */
class NPCPortraitService {
  private readonly coordinator = new ImageRequestCoordinator<string>();

  /**
   * Generate a portrait for an NPC and persist its URL on the NPC record.
   */
  async generateForNPC(npcId: string, world: World): Promise<string> {
    const npcStore = useNPCStore.getState();
    const npc = npcStore.npcs[npcId];

    if (!npc) {
      logger.error('generateForNPC', 'NPC not found', { npcId });
      throw new Error(`NPC not found: ${npcId}`);
    }

    const portraitUrl = await this.coordinator.run(npcId, () =>
      this._fetchPortrait(npc.name, npc.description, world)
    );

    npcStore.updateNPC(npcId, { avatarUrl: portraitUrl });
    logger.info('generateForNPC', `Portrait generated for NPC: ${npc.name}`, {
      npcId,
      portraitUrl,
    });

    return portraitUrl;
  }

  private async _fetchPortrait(
    npcName: string,
    npcDescription: string,
    world: World
  ): Promise<string> {
    const payload = {
      character: {
        name: npcName,
        background: { physicalDescription: npcDescription },
      },
      customDescription: npcDescription,
      world: { genre: world.genre, toneSettings: world.toneSettings },
    };

    logger.debug('_fetchPortrait', 'Calling /api/generate-portrait', {
      npcName,
      genre: world.genre,
    });

    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Portrait generation failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const portraitUrl = data.portrait?.url || data.image;

    if (!portraitUrl) {
      throw new Error('Portrait URL not found in response');
    }

    return portraitUrl;
  }

  /**
   * Bootstrap portrait generation for every NPC in a world that lacks one.
   */
  async bootstrapNpcPortraits(worldId: string): Promise<void> {
    const world = useWorldStore.getState().worlds[worldId];
    if (!world) {
      logger.warn('bootstrapNpcPortraits', `World not found: ${worldId}`);
      return;
    }

    const npcs = Object.values(useNPCStore.getState().npcs).filter(
      (npc) => npc.worldId === worldId && !npc.avatarUrl
    );

    if (npcs.length === 0) {
      logger.debug(
        'bootstrapNpcPortraits',
        `No NPCs need portraits in world: ${worldId}`
      );
      return;
    }

    logger.info(
      'bootstrapNpcPortraits',
      `Generating portraits for ${npcs.length} NPCs`,
      { worldId, npcCount: npcs.length }
    );

    await this.coordinator.runBatch(npcs, async (npc) => {
      try {
        await this.generateForNPC(npc.id, world);
      } catch (error) {
        logger.warn(
          'bootstrapNpcPortraits',
          `Failed to generate portrait for NPC: ${npc.name}`,
          { npcId: npc.id, error }
        );
        throw error;
      }
    });

    logger.info('bootstrapNpcPortraits', 'Bootstrap complete', { worldId });
  }

  /** Clear the in-memory cache (useful for testing). */
  clearCache(): void {
    this.coordinator.clearCache();
  }
}

export const npcPortraitService = new NPCPortraitService();
