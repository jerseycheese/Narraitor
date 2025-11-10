/**
 * ContextBuilder
 *
 * Builds complete NarrativeGenerationContext from requests
 * Uses NarrativeContextGateway to fetch data from stores
 */

import { EntityID } from '@/types/common.types';
import { NarrativeGenerationRequest } from '@/types/narrative.types';
import { NarrativeGenerationContext } from './narrativeGenerationContext';
import { NarrativeContextGateway } from './narrativeContextGateway';
import { playerDecisionTracker } from './playerDecisionTracker';
import { getLoreContextForPrompt } from './loreContextHelper';
import { getTimestamp } from '@/lib/utils';
import { CurrentNarrativeContext } from '@/types/relevance.types';

export class ContextBuilder {
  constructor(private gateway: NarrativeContextGateway) {}

  /**
   * Build complete context from a generation request
   */
  async buildContext(
    request: NarrativeGenerationRequest,
    templateType: string
  ): Promise<NarrativeGenerationContext> {
    const world = this.gateway.getWorld(request.worldId);
    if (!world) {
      throw new Error(`World not found: ${request.worldId}`);
    }

    // Get all characters
    const allCharacters = this.gateway.getAllCharacters();
    const characterIds = request.characterIds || [];
    const playerCharacterId = characterIds[0];
    const playerCharacter = playerCharacterId
      ? this.gateway.getCharacter(playerCharacterId)
      : null;

    // Get NPC roster
    const npcRoster = this.gateway.buildNpcRoster(request.worldId);

    // Get AI context
    const aiContext = request.sessionId
      ? this.gateway.getAIContextForSession(request.sessionId)
      : { activeGoals: [] };

    // Get relevant decisions
    const relevantDecisions = await this.getRelevantDecisions(
      request.worldId,
      request.sessionId,
      request.narrativeContext
    );

    // Get inventory items
    const inventoryItems = playerCharacterId
      ? this.gateway.getCharacterItems(playerCharacterId)
      : [];

    // Get equipped item IDs
    const equippedItemIds = playerCharacterId
      ? this.gateway.getEquippedItemIds(playerCharacterId)
      : [];

    // Get other character context for multi-character worlds
    const otherCharacterContext = playerCharacterId
      ? this.buildOtherCharacterContext(request.worldId, playerCharacterId)
      : undefined;

    // Get lore context
    const loreContext = getLoreContextForPrompt(request.worldId);

    return {
      world,
      worldId: request.worldId,
      characters: allCharacters,
      characterIds,
      playerCharacter,
      sessionId: request.sessionId,
      narrativeContext: request.narrativeContext,
      npcRoster,
      toneSettings: world.toneSettings,
      relevantDecisions,
      goals: aiContext.activeGoals,
      goalContext: aiContext.goalContext,
      inventoryItems,
      equippedItemIds,
      otherCharacterContext,
      loreContext,
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
    const world = this.gateway.getWorld(worldId);
    if (!world) {
      throw new Error(`World not found: ${worldId}`);
    }

    const allCharacters = this.gateway.getAllCharacters();
    const playerCharacterId = characterIds[0];
    const playerCharacter = playerCharacterId
      ? this.gateway.getCharacter(playerCharacterId)
      : null;

    const npcRoster = this.gateway.buildNpcRoster(worldId);

    const aiContext = sessionId
      ? this.gateway.getAIContextForSession(sessionId)
      : { activeGoals: [] };

    // Get relevant decisions (may have some from other sessions)
    const relevantDecisions = await this.getRelevantDecisions(
      worldId,
      sessionId,
      undefined
    );

    const inventoryItems = playerCharacterId
      ? this.gateway.getCharacterItems(playerCharacterId)
      : [];

    const equippedItemIds = playerCharacterId
      ? this.gateway.getEquippedItemIds(playerCharacterId)
      : [];

    const otherCharacterContext = playerCharacterId
      ? this.buildOtherCharacterContext(worldId, playerCharacterId)
      : undefined;

    const loreContext = getLoreContextForPrompt(worldId);

    return {
      world,
      worldId,
      characters: allCharacters,
      characterIds,
      playerCharacter,
      sessionId,
      narrativeContext: undefined,
      npcRoster,
      toneSettings: world.toneSettings,
      relevantDecisions,
      goals: aiContext.activeGoals,
      goalContext: aiContext.goalContext,
      inventoryItems,
      equippedItemIds,
      otherCharacterContext,
      loreContext,
      generationParameters: undefined,
      templateType: 'initialScene',
    };
  }

  /**
   * Get relevant decisions using the relevance system
   */
  private async getRelevantDecisions(
    worldId: EntityID,
    sessionId?: EntityID,
    narrativeContext?: NarrativeGenerationRequest['narrativeContext']
  ) {
    if (!sessionId) {
      // Fallback: get recent world decisions if no session ID
      const allWorldDecisions = playerDecisionTracker.getWorldDecisions(worldId);
      return allWorldDecisions.slice(0, 15);
    }

    // Build current narrative context for relevance scoring
    const currentContext = this.buildCurrentNarrativeContext(
      worldId,
      sessionId,
      narrativeContext
    );

    // Use relevance system to get most important decisions with scores (max 15)
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

    // Extract decisions for personalization engine
    return decisionsWithScores.map(item => item.decision);
  }

  /**
   * Build CurrentNarrativeContext from narrative generation request context
   */
  private buildCurrentNarrativeContext(
    worldId: EntityID,
    sessionId: EntityID,
    narrativeContext?: NarrativeGenerationRequest['narrativeContext']
  ): CurrentNarrativeContext {
    // Extract location from narrative context
    const latestRecentSegment =
      narrativeContext?.recentSegments &&
      narrativeContext.recentSegments.length > 0
        ? narrativeContext.recentSegments[narrativeContext.recentSegments.length - 1]
        : undefined;

    const location = narrativeContext?.currentLocation ||
                     latestRecentSegment?.metadata?.location;

    // Extract characters present from narrative context
    const charactersPresent: string[] = [];
    if (narrativeContext?.characterIds) {
      charactersPresent.push(...narrativeContext.characterIds);
    }
    // Add characters from recent segments
    if (narrativeContext?.recentSegments) {
      narrativeContext.recentSegments.forEach(segment => {
        if (segment.metadata.characterIds) {
          segment.metadata.characterIds.forEach(charId => {
            if (!charactersPresent.includes(charId)) {
              charactersPresent.push(charId);
            }
          });
        }
      });
    }

    // Extract situation from narrative context
    const situation = narrativeContext?.currentSituation;

    // Extract recent events from recent segments
    const recentEvents: string[] = [];
    if (narrativeContext?.recentSegments) {
      narrativeContext.recentSegments.forEach(segment => {
        if (segment.content) {
          const summary = segment.content.substring(0, 100).trim();
          if (summary) {
            recentEvents.push(summary);
          }
        }
      });
    }

    // Extract active tags from narrative context
    const activeTags = narrativeContext?.currentTags || [];

    return {
      location,
      charactersPresent,
      situation,
      recentEvents,
      activeTags,
      worldId,
      sessionId,
      timestamp: getTimestamp()
    };
  }

  /**
   * Build other character context for multi-character worlds
   */
  private buildOtherCharacterContext(
    worldId: EntityID,
    activeCharacterId: EntityID
  ): string | null {
    const contextData = this.gateway.getOtherCharacterContext(
      worldId,
      activeCharacterId,
      3, // MAX_OTHER_CHARACTER_THREADS
      2, // MAX_CROSS_CHARACTER_REFERENCES
      160 // PROMPT_THREAD_SUMMARY_LENGTH
    );

    if (!contextData || contextData.threads.length === 0) {
      return null;
    }

    const lines = contextData.threads.map((thread) => {
      const relationshipDescriptor = thread.relationship
        ? ` Relationship: ${thread.relationship}.`
        : '';

      const referenceDescriptor =
        thread.recentReferences.length > 0
          ? ` Recent cross-over: ${thread.recentReferences
              .map((ref) => ref.summary)
              .join('; ')}.`
          : '';

      return `- ${thread.name}: ${thread.highlight}.${relationshipDescriptor}${referenceDescriptor}`;
    });

    return `OTHER PLAYER CHARACTERS (SHARED WORLD CONTEXT):\n${lines.join('\n')}`;
  }
}
