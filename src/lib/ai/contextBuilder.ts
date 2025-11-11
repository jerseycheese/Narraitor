/**
 * ContextBuilder
 *
 * Builds complete context for narrative generation from stores.
 * Consolidates context plumbing without excessive wrapper methods.
 */

import { EntityID } from '@/types/common.types';
import { NarrativeGenerationRequest, NarrativeContext } from '@/types/narrative.types';
import { ToneSettings } from '@/types/tone-settings.types';
import { PlayerDecision } from '@/types/personalization.types';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { playerDecisionTracker } from './playerDecisionTracker';
import { getLoreContextForPrompt } from './loreContextHelper';
import { getTimestamp } from '@/lib/utils';
import { CurrentNarrativeContext } from '@/types/relevance.types';

/**
 * Complete context for narrative generation
 */
export interface NarrativeGenerationContext {
  world: {
    id: string;
    name: string;
    description: string;
    genre: string;
    attributes: unknown[];
    skills?: unknown[];
    toneSettings: ToneSettings;
  };
  worldId: EntityID;
  characters: Record<EntityID, unknown>;
  characterIds: EntityID[];
  playerCharacter: unknown;
  sessionId?: EntityID;
  narrativeContext?: NarrativeContext;
  npcRoster: Array<{ id: string; name: string; description?: string; avatarUrl?: string }>;
  toneSettings: ToneSettings;
  relevantDecisions: PlayerDecision[];
  goals: Array<Record<string, unknown>>;
  goalContext?: string;
  inventoryItems: Array<unknown>;
  equippedItemIds: string[];
  otherCharacterContext?: string;
  loreContext: string;
  generationParameters?: NarrativeGenerationRequest['generationParameters'];
  templateType: string;
}

export class ContextBuilder {
  /**
   * Build complete context from a generation request
   */
  async buildContext(
    request: NarrativeGenerationRequest,
    templateType: string
  ): Promise<NarrativeGenerationContext> {
    const { worlds } = useWorldStore.getState();
    const world = worlds[request.worldId];
    if (!world) {
      throw new Error(`World not found: ${request.worldId}`);
    }

    const { characters } = useCharacterStore.getState();
    const characterIds = request.characterIds || [];
    const playerCharacterId = characterIds[0];
    const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;

    // Get NPC roster
    const npcState = useNPCStore.getState();
    const npcRoster = typeof npcState.getNPCsByWorld === 'function'
      ? (npcState.getNPCsByWorld(request.worldId) || []).map(npc => ({
          id: npc.id,
          name: npc.name,
          description: npc.description,
          avatarUrl: npc.avatarUrl,
        }))
      : [];

    // Get AI context
    const aiContext = request.sessionId
      ? useAiContextStore.getState().buildContextForSession(request.sessionId)
      : { activeGoals: [] };

    // Get relevant decisions
    const relevantDecisions = await this.getRelevantDecisions(
      request.worldId,
      request.sessionId,
      request.narrativeContext
    );

    // Get inventory
    const inventoryItems = playerCharacterId
      ? useInventoryStore.getState().getCharacterItems(playerCharacterId) || []
      : [];

    const equippedItemIds = playerCharacterId && playerCharacter?.inventory
      ? ((playerCharacter.inventory as { items: Array<{ id: string; equipped?: boolean }> }).items || [])
          .filter(item => item?.equipped)
          .map(item => item.id)
      : [];

    // Other character context
    const otherCharacterContext = playerCharacterId
      ? this.buildOtherCharacterContext(request.worldId, playerCharacterId)
      : undefined;

    return {
      world: {
        id: world.id,
        name: world.name,
        description: world.description,
        genre: world.genre,
        attributes: world.attributes,
        skills: world.skills,
        toneSettings: world.toneSettings || { contentRating: 'teen', narrativeStyle: 'balanced', languageComplexity: 'moderate' },
      },
      worldId: request.worldId,
      characters,
      characterIds,
      playerCharacter,
      sessionId: request.sessionId,
      narrativeContext: request.narrativeContext,
      npcRoster,
      toneSettings: world.toneSettings || { contentRating: 'teen', narrativeStyle: 'balanced', languageComplexity: 'moderate' },
      relevantDecisions,
      goals: aiContext.activeGoals || [],
      goalContext: aiContext.goalContext,
      inventoryItems,
      equippedItemIds,
      otherCharacterContext,
      loreContext: getLoreContextForPrompt(request.worldId),
      generationParameters: request.generationParameters,
      templateType,
    };
  }

  /**
   * Build context for initial scene generation
   */
  async buildInitialSceneContext(
    worldId: EntityID,
    characterIds: EntityID[],
    sessionId?: EntityID
  ): Promise<NarrativeGenerationContext> {
    return this.buildContext(
      {
        worldId,
        characterIds,
        sessionId,
      },
      'initialScene'
    );
  }

  private async getRelevantDecisions(
    worldId: EntityID,
    sessionId?: EntityID,
    narrativeContext?: NarrativeContext
  ) {
    if (!sessionId) {
      return playerDecisionTracker.getWorldDecisions(worldId).slice(0, 15);
    }

    const currentContext = this.buildCurrentNarrativeContext(
      worldId,
      sessionId,
      narrativeContext
    );

    let decisionsWithScores = playerDecisionTracker.getRelevantDecisionsWithScores(
      currentContext,
      15,
      { worldId, sessionId }
    );

    if (decisionsWithScores.length === 0) {
      decisionsWithScores = playerDecisionTracker.getRelevantDecisionsWithScores(
        currentContext,
        15,
        { worldId }
      );
    }

    return decisionsWithScores.map(item => item.decision);
  }

  private buildCurrentNarrativeContext(
    worldId: EntityID,
    sessionId: EntityID,
    narrativeContext?: NarrativeContext
  ): CurrentNarrativeContext {
    const latestRecentSegment = narrativeContext?.recentSegments?.[narrativeContext.recentSegments.length - 1];
    const location = narrativeContext?.currentLocation || latestRecentSegment?.metadata?.location;

    const charactersPresent: string[] = [];
    if (narrativeContext?.characterIds) {
      charactersPresent.push(...narrativeContext.characterIds);
    }
    narrativeContext?.recentSegments?.forEach(segment => {
      segment.metadata.characterIds?.forEach(charId => {
        if (!charactersPresent.includes(charId)) {
          charactersPresent.push(charId);
        }
      });
    });

    const recentEvents = narrativeContext?.recentSegments?.map(s =>
      s.content.substring(0, 100).trim()
    ).filter(Boolean) || [];

    return {
      location,
      charactersPresent,
      situation: narrativeContext?.currentSituation,
      recentEvents,
      activeTags: narrativeContext?.currentTags || [],
      worldId,
      sessionId,
      timestamp: getTimestamp()
    };
  }

  private buildOtherCharacterContext(worldId: EntityID, activeCharacterId: EntityID): string | null {
    const { worldStates } = useWorldStore.getState();
    const worldState = worldStates[worldId];
    if (!worldState?.playerCharacterThreads) return null;

    const threads = Object.values(worldState.playerCharacterThreads)
      .filter(t => t.characterId !== activeCharacterId)
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, 3);

    if (threads.length === 0) return null;

    const { characters } = useCharacterStore.getState();
    const lines = threads.map(thread => {
      const name = characters[thread.characterId]?.name ?? `Character ${thread.characterId}`;
      return `- ${name}: Recent activity recorded.`;
    });

    return `OTHER PLAYER CHARACTERS (SHARED WORLD CONTEXT):\n${lines.join('\n')}`;
  }
}
