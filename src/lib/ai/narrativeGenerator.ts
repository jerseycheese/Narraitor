import { AIClient } from './types';
import { getNarrativeTemplate } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import {
  Decision,
  NarrativeContext,
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  GenerationParameters,
} from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import type { SessionSnapshot } from '@/types/turnResolver.types';
import { generateChoices } from './choiceGenerator';
import { checkAndRecordLoreMentions } from './loreContextHelper';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { inferItemsLostFromNarrative } from '@/lib/narrative/itemLossInference';
import { inferSegmentType } from '@/lib/utils/segmentTypeInference';
import { logger } from '@/lib/utils/logger';
import { useInventoryStore } from '@/state/inventoryStore';
import {
  recordRequestCalibration,
} from './narrativeGenerator.calibration';
import {
  buildNarrativeContext,
  convertToPersonalizationCharacter,
  enhancePromptWithInventory,
  enhancePromptWithItemAcquisitionInstructions,
  enhancePromptWithItemLossInstructions,
  enhancePromptWithWorldCost,
  enhancePromptWithGoalContext,
  enhancePromptWithLore,
  enhancePromptWithPersonalization,
  enhancePromptWithToneSettings,
  type NarrativeStaticContentCache,
} from './narrativeGenerator.prompt';
import { formatNarrativeResponse } from './narrativeGenerator.response';
import { getCarryForwardLocation } from './narrativeGenerator.response.helpers';
import { enforceLanguageComplexity } from './narrativeGenerator.languageComplexity';
import { buildNpcRoster } from './narrativeGenerator.npc';
import {
  applyContinuityGuardrail,
  buildContinuityContractFromStores,
  enhancePromptWithContinuityExpectations,
} from './narrativeGenerator.continuity';
import { WORLD_CLOCK_TRANSITION_TAG } from '@/lib/narrative/turnTags';
import {
  buildKnownNameTokens,
  enhancePromptWithPhraseVariety,
} from './narrativeGenerator.phraseVariety';

/**
 * Stop an abandoned generation before its side effects run. Callers that race
 * generation against a UI timeout abort this signal on race loss; without the
 * check, a generation that loses the race would still write lore, inventory,
 * and NPC state minutes after the UI took the fallback path.
 */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Narrative generation aborted by caller');
  }
}

export class NarrativeGenerator {
  private staticContentCache: NarrativeStaticContentCache = {
    toneSettings: new Map(),
  };

  constructor(private geminiClient: AIClient) {}

  /**
   * options.onChunk streams the RAW model draft as it's generated, before
   * enforceLanguageComplexity/applyContinuityGuardrail below get a chance to
   * rewrite it. On the rare turn where one of those fires a real correction,
   * a caller subscribed to onChunk briefly shows the uncorrected line before
   * the final NarrativeGenerationResult replaces it. Buffering the stream
   * until guardrails clear would remove that gap, but at the cost of the
   * extra guardrail round-trip's latency on every turn that has one — the
   * exact wait this streaming path exists to cut. Accepted trade-off for
   * now; revisit if guardrail corrections turn out more common than rare.
   */
  async generateSegment(
    request: NarrativeGenerationRequest,
    options?: { signal?: AbortSignal; onChunk?: (delta: string) => void }
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      const template = this.getTemplate('scene');

      const context = buildNarrativeContext(world, request);
      const prompt = template(context);

      const toneEnhancedPrompt = enhancePromptWithToneSettings(
        prompt,
        world,
        this.staticContentCache
      );
      const loreEnhancedPrompt = enhancePromptWithLore(
        toneEnhancedPrompt,
        request.worldId,
        request.sessionId
      );
      const goalEnhancedPrompt = await enhancePromptWithGoalContext(
        loreEnhancedPrompt,
        request.sessionId
      );
      const personalizedPrompt = await enhancePromptWithPersonalization(
        goalEnhancedPrompt,
        request.worldId,
        request.characterIds || [],
        request.sessionId
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        personalizedPrompt,
        request.characterIds || []
      );

      // Fetch character inventory for loss context
      const characterIdForLoss = request.characterIds?.[0];
      const characterInventory = characterIdForLoss
        ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
        : [];

      const acquisitionEnhancedPrompt = enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt,
        this.staticContentCache
      );

      const lossEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );
      const fullyEnhancedPrompt = enhancePromptWithWorldCost(
        lossEnhancedPrompt,
        request.characterIds || []
      );

      // Never flag names the model is instructed to use naturally (sceneTemplate.ts) —
      // the world/player/NPC/important-entity names already in context.
      const knownNameTokens = buildKnownNameTokens([
        context.worldName,
        context.playerCharacterName,
        ...context.npcRoster.map((npc) => npc.name),
        ...(context.narrativeContext?.importantEntities?.map((entity) => entity.name) ?? []),
      ]);
      const phraseVarietyPrompt = enhancePromptWithPhraseVariety(
        fullyEnhancedPrompt,
        request.narrativeContext?.recentSegments,
        knownNameTokens
      );

      const continuityContract = buildContinuityContractFromStores(request, {
        playerName: context.playerCharacterName,
      });
      const finalPrompt = enhancePromptWithContinuityExpectations(
        phraseVarietyPrompt,
        continuityContract
      );

      const response = await this.geminiClient.generateContent(finalPrompt, {
        signal: options?.signal,
        onChunk: options?.onChunk,
      });
      throwIfAborted(options?.signal);
      recordRequestCalibration(finalPrompt, response);

      let result = await formatNarrativeResponse(
        response,
        inferSegmentType(response.content || ''),
        this.geminiClient,
        getCarryForwardLocation(request.narrativeContext)
      );

      result = await enforceLanguageComplexity(result, toneSettings, this.geminiClient);

      result = await applyContinuityGuardrail({
        result,
        contract: continuityContract,
        client: this.geminiClient,
        worldId: request.worldId,
        sessionId: request.sessionId,
      });

      // A world-clock boundary is resolver-selected state, not a model
      // classification. Keep it recorded even if the response labels its own
      // prose as a scene, so the next turn starts on the far side of the cut.
      if (request.generationParameters?.segmentType === 'transition') {
        result = {
          ...result,
          segmentType: 'transition',
          metadata: {
            ...result.metadata,
            tags: Array.from(new Set([
              ...(result.metadata.tags ?? []),
              'transition',
              WORLD_CLOCK_TRANSITION_TAG,
            ])),
          },
        };
      }
      // Re-check after the guardrail round-trips: a caller that aborted
      // mid-pipeline should not get a result back.
      throwIfAborted(options?.signal);

      return result;
    } catch (error) {
      logger.error('Failed to generate narrative segment', { error });
      throw new Error('Failed to generate narrative segment');
    }
  }

  // Deliberately not continuity-guarded: at session start there are no
  // decisions or NPC relationships to validate against (#409/#412).
  async generateInitialScene(
    worldId: string,
    characterIds: string[],
    sessionId?: string,
    options?: {
      generationParameters?: GenerationParameters;
      signal?: AbortSignal;
      onChunk?: (delta: string) => void;
    }
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      const template = this.getTemplate('initialScene');

      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const storeCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;
      const playerCharacter = storeCharacter
        ? convertToPersonalizationCharacter(storeCharacter)
        : null;

      const npcRoster = buildNpcRoster(world.id);

      const context = {
        worldName: world.name,
        worldDescription: world.description,
        genre: world.genre,
        tone: toneSettings.narrativeStyle,
        attributes: world.attributes,
        characterIds,
        playerCharacterName: playerCharacter?.name,
        playerCharacterBackground: playerCharacter?.background,
        toneSettings: toneSettings,
        npcRoster,
      };

      const prompt = template(context);

      const toneEnhancedPrompt = enhancePromptWithToneSettings(
        prompt,
        world,
        this.staticContentCache
      );
      const loreEnhancedPrompt = enhancePromptWithLore(
        toneEnhancedPrompt,
        worldId,
        sessionId
      );
      const personalizedPrompt = await enhancePromptWithPersonalization(
        loreEnhancedPrompt,
        worldId,
        characterIds,
        sessionId
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        personalizedPrompt,
        characterIds
      );

      // Fetch character inventory for loss context
      const characterIdForLoss = characterIds[0];
      const characterInventory = characterIdForLoss
        ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
        : [];

      const acquisitionEnhancedPrompt = enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt,
        this.staticContentCache
      );

      const lossEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );
      const fullyEnhancedPrompt = enhancePromptWithWorldCost(
        lossEnhancedPrompt,
        characterIds
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt, {
        signal: options?.signal,
        onChunk: options?.onChunk,
      });
      throwIfAborted(options?.signal);
      recordRequestCalibration(fullyEnhancedPrompt, response);

      // The opening segment is the one turn with no earlier place to carry forward.
      let result = await formatNarrativeResponse(
        response,
        inferSegmentType(response.content || ''),
        this.geminiClient
      );

      result = await enforceLanguageComplexity(result, toneSettings, this.geminiClient);

      if (
        (!result.metadata.itemsLost || result.metadata.itemsLost.length === 0) &&
        result.content
      ) {
        const inferredLosses = inferItemsLostFromNarrative(
          result.content,
          characterInventory
        );

        if (inferredLosses.length > 0) {
          logger.info(
            `Inferred ${inferredLosses.length} item losses from narrative in generateInitialScene`,
            {
              items: inferredLosses.map((i) => i.name),
            }
          );
          result = {
            ...result,
            metadata: {
              ...result.metadata,
              itemsLost: inferredLosses,
            },
          };
        }
      }

      try {
        checkAndRecordLoreMentions(worldId, sessionId, result.content ?? '', 'narrative');
      } catch (error) {
        logger.warn('Failed to record lore mentions:', error);
      }

      return result;
    } catch (error) {
      logger.error('Failed to generate initial scene', { error });
      throw new Error('Failed to generate initial scene');
    }
  }

  private getWorld(worldId: string): World {
    const { worlds } = useWorldStore.getState();
    const world = worlds[worldId];

    if (!world) {
      throw new Error(`World not found: ${worldId}`);
    }

    return world;
  }

  private getTemplate(segmentType: string) {
    const templateKey = `narrative/${segmentType}`;
    return getNarrativeTemplate(templateKey);
  }

  async generatePlayerChoices(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[],
    sessionId?: EntityID,
    snapshot?: SessionSnapshot
  ): Promise<Decision> {
    try {
      const result = await generateChoices(this.geminiClient, {
        worldId,
        narrativeContext,
        characterIds,
        sessionId: sessionId || narrativeContext.sessionId || snapshot?.sessionId,
        minOptions: 3,
        maxOptions: 3,
        useAlignedChoices: true,
        snapshot,
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate player choices', { error });
      const fallbackId = `decision-fallback-${Date.now()}`;
      return {
        id: fallbackId,
        prompt: 'What will you do next?',
        options: [
          {
            id: `option-${fallbackId}-1`,
            text: 'Investigate further',
            alignment: 'neutral',
          },
          {
            id: `option-${fallbackId}-2`,
            text: 'Talk to nearby characters',
            alignment: 'lawful',
          },
          {
            id: `option-${fallbackId}-3`,
            text: 'Move to a new location',
            alignment: 'neutral',
          },
        ],
        decisionWeight: 'minor',
        contextSummary: `In ${
          narrativeContext.currentLocation || 'an unknown location'
        }, ${narrativeContext.currentSituation || 'making a decision'}.`,
      };
    }
  }
}
