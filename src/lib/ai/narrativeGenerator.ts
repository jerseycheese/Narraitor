import { AIClient } from './types';
import { getNarrativeTemplate } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import {
  Decision,
  NarrativeContext,
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  NarrativeSegment,
  GeneratedCharacterMetadata,
  GenerationParameters,
} from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateChoices } from './choiceGenerator';
import { getLoreContextForPrompt, checkAndRecordLoreMentions } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import { processLostItems } from '@/lib/narrative/itemLossProcessor';
import { inferItemsLostFromNarrative } from '@/lib/narrative/itemLossInference';
import { inferSegmentType } from '@/lib/utils/segmentTypeInference';
import { logger } from '@/lib/utils/logger';
import { useInventoryStore } from '@/state/inventoryStore';
import {
  buildPromptDebugInfo,
  isDebugInfoEnabled,
  type DebugInfoContext,
} from './debugInfoBuilder';
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
import { getActiveProviderModel } from '@/state/providerStore';
import { DEFAULT_TEXT_MODEL } from './config';
import { enforceLanguageComplexity } from './narrativeGenerator.languageComplexity';
import { buildNpcRoster, syncNpcMetadata } from './narrativeGenerator.npc';
import {
  applyContinuityGuardrail,
  buildContinuityContractFromStores,
  collectContinuityTopicsFromStores,
  enhancePromptWithContinuityExpectations,
} from './narrativeGenerator.continuity';
import { isResolverActive } from '@/lib/narrative/resolverGuard';
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

      const loreContext = getLoreContextForPrompt(request.worldId, request.sessionId, { recordUsage: false });

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
      // Re-check before the store-mutating tail (lore extraction, item
      // acquisition/loss, NPC sync) in case the caller aborted mid-pipeline.
      throwIfAborted(options?.signal);

      // When the TurnResolver drives this session, it handles all post-
      // generation side effects (lore, inventory, NPC sync) itself, so skip
      // the fire-and-forget tails here to avoid duplicate writers.
      if (request.sessionId && isResolverActive(request.sessionId)) {
        return result;
      }

      // Lore extraction runs on the final (possibly corrected) prose so a
      // contradicted draft never pollutes the lore store. Deferred off the
      // per-turn path — it's a full extra Gemini round-trip that only
      // enriches later prompts, nothing in this turn's UI reads it.
      if (result.content) {
        if (process.env.NODE_ENV !== 'production') {
          logger.info('[NarrativeGenerator] EXTRACTION: Post-segment', {
            worldId: request.worldId,
            sessionId: request.sessionId,
            contentLength: result.content.length,
          });
        }

        const existingLoreContext = getLoreContextForPrompt(request.worldId, request.sessionId, {
          recordUsage: false,
        });
        // Keyed on the invented-exchange issues that actually survived into the
        // shipped prose, not on the aggregate status: a segment whose
        // correction fixed a different issue reports 'corrected' with the
        // invention still in it. Quarantine only those speakers, nobody else.
        const unattestedSpeakers = (
          result.metadata.continuity?.remainingIssues ?? []
        )
          .filter((issue) => issue.type === 'invented-exchange')
          .map((issue) => issue.entity);

        void extractStructuredLore(result.content, existingLoreContext, {
          continuityTopics: collectContinuityTopicsFromStores(request),
          playerCharacterName: context.playerCharacterName,
          ...(unattestedSpeakers.length > 0 ? { unattestedSpeakers } : {}),
        })
          .then(async (structuredLore) => {
            const { useLoreStore } = await import('@/state/loreStore');
            const { addStructuredLore } = useLoreStore.getState();
            addStructuredLore(structuredLore, request.worldId, request.sessionId);

            if (process.env.NODE_ENV !== 'production') {
              logger.info('[NarrativeGenerator] Extracted and stored lore:', {
                worldId: request.worldId,
                sessionId: request.sessionId,
                factCount:
                  structuredLore.characters.length +
                  structuredLore.locations.length +
                  structuredLore.events.length +
                  structuredLore.rules.length,
                characters: structuredLore.characters.map((c) => c.name),
                locations: structuredLore.locations.map((l) => l.name),
                events: structuredLore.events.length,
                rules: structuredLore.rules.length,
              });
            }
          })
          .catch((error) => {
            logger.error('[NarrativeGenerator] Failed to extract lore:', error);
          });
      }

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
            `Inferred ${inferredLosses.length} item losses from narrative in generateSegment`,
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
        checkAndRecordLoreMentions(request.worldId, request.sessionId, result.content ?? '', 'narrative');
      } catch (error) {
        logger.warn('Failed to record lore mentions:', error);
      }

      if (isDebugInfoEnabled()) {
        const previousSegments = request.narrativeContext?.previousSegments || [];
        const previousSegment = previousSegments[previousSegments.length - 1];
        const templateType = 'scene';

        const debugInfoContext: DebugInfoContext = {
          fullPrompt: finalPrompt,
          templateName: this.getTemplateName(templateType),
          world,
          toneSettings,
          loreContext,
          characterIds: request.characterIds,
          previousSegmentContent: previousSegment?.content,
          previousSegmentType: previousSegment?.type,
          tokenUsage: result.tokenUsage,
          modelUsed: getActiveProviderModel() ?? DEFAULT_TEXT_MODEL,
        };

        result.metadata.debugInfo = buildPromptDebugInfo(debugInfoContext);
      }

      if (
        !request.generationParameters?.disableItemAcquisitionProcessing &&
        result.metadata.itemsAcquired &&
        result.metadata.itemsAcquired.length > 0
      ) {
        const characterId = request.characterIds?.[0];
        if (characterId && request.sessionId) {
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            request.sessionId
          );
        }
      }

      // Process item losses (parallel to acquisition processing)
      if (
        !request.generationParameters?.disableItemLossProcessing &&
        result.metadata.itemsLost &&
        result.metadata.itemsLost.length > 0
      ) {
        const characterId = request.characterIds?.[0];
        if (characterId && request.sessionId) {
          void processLostItems(
            result.metadata.itemsLost,
            characterId,
            request.sessionId
          );
        }
      }

      this.syncNpcMetadata(request.worldId, result.metadata.characters);

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

      // Deferred off the per-turn path, same as generateSegment above.
      if (response.content) {
        if (process.env.NODE_ENV !== 'production') {
          logger.info('[NarrativeGenerator] EXTRACTION: Initial scene', {
            worldId,
            sessionId,
            contentLength: response.content.length,
          });
        }

        const existingLoreContext = getLoreContextForPrompt(worldId, sessionId, {
          recordUsage: false,
        });
        void extractStructuredLore(response.content, existingLoreContext, {
          playerCharacterName: playerCharacter?.name,
        })
          .then(async (structuredLore) => {
            const { useLoreStore } = await import('@/state/loreStore');
            const { addStructuredLore } = useLoreStore.getState();
            addStructuredLore(structuredLore, worldId, sessionId);

            if (process.env.NODE_ENV !== 'production') {
              logger.info(
                '[NarrativeGenerator] Extracted and stored lore from initial scene:',
                {
                  worldId,
                  sessionId,
                  factCount:
                    structuredLore.characters.length +
                    structuredLore.locations.length +
                    structuredLore.events.length +
                    structuredLore.rules.length,
                  characters: structuredLore.characters.map((c) => c.name),
                  locations: structuredLore.locations.map((l) => l.name),
                  events: structuredLore.events.length,
                  rules: structuredLore.rules.length,
                }
              );
            }
          })
          .catch((error) => {
            logger.error(
              '[NarrativeGenerator] Failed to extract lore from initial scene:',
              error
            );
          });
      }

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

      // Resolver guard: skip item processing and NPC sync when the resolver
      // drives this session (it awaits those itself).
      if (sessionId && isResolverActive(sessionId)) {
        return result;
      }

      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        if (characterId && sessionId) {
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            sessionId
          );
        }
      }

      if (
        !options?.generationParameters?.disableItemLossProcessing &&
        result.metadata.itemsLost &&
        result.metadata.itemsLost.length > 0
      ) {
        const characterId = characterIds[0];
        if (characterId && sessionId) {
          void processLostItems(
            result.metadata.itemsLost,
            characterId,
            sessionId
          );
        }
      }

      this.syncNpcMetadata(worldId, result.metadata.characters);

      return result;
    } catch (error) {
      logger.error('Failed to generate initial scene', { error });
      throw new Error('Failed to generate initial scene');
    }
  }

  async generateTransition(
    from: NarrativeSegment,
    to: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    const world = this.getWorld(to.worldId);
    const template = this.getTemplate('transition');

    const context = {
      previousContent: from.content,
      previousType: from.type,
      worldName: world.name,
      genre: world.genre,
      tone: 'default',
      newLocation: to.narrativeContext?.currentLocation,
    };

    const prompt = template(context);
    const response = await this.geminiClient.generateContent(prompt);

    const result = await formatNarrativeResponse(
      response,
      'transition',
      this.geminiClient,
      // A transition is heading somewhere named; without one, it stays put.
      to.narrativeContext?.currentLocation || from.metadata?.location
    );
    this.syncNpcMetadata(to.worldId, result.metadata.characters);
    return result;
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

  private getTemplateName(segmentType: string): string {
    const names: Record<string, string> = {
      scene: 'Scene Template',
      dialogue: 'Dialogue Template',
      action: 'Action Template',
      transition: 'Transition Template',
      initial: 'Initial Scene Template',
    };
    return names[segmentType] || 'Unknown Template';
  }

  async generateSkillAcknowledgment(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[],
    skillUsed?: {
      skillId: string;
      skillName: string;
      success: boolean;
      difficulty: number;
    },
    customAction?: {
      action: string;
      implicitSkills?: string[];
    },
    options?: { generationParameters?: GenerationParameters }
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      const template = this.getTemplate('skillAcknowledgment');

      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;

      const context = {
        worldName: world.name,
        genre: world.genre,
        narrativeContext,
        playerCharacterName: playerCharacter?.name,
        skillUsed,
        customAction,
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
        narrativeContext.sessionId
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        loreEnhancedPrompt,
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

      const fullyEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      recordRequestCalibration(fullyEnhancedPrompt, response);

      let result = await formatNarrativeResponse(
        response,
        inferSegmentType(response.content || ''),
        this.geminiClient,
        getCarryForwardLocation(narrativeContext)
      );

      result = await enforceLanguageComplexity(result, toneSettings, this.geminiClient);

      if (
        (!result.metadata.itemsLost || result.metadata.itemsLost.length === 0) &&
        result.content
      ) {
        const characterIdForLoss = characterIds[0];
        const currentInventory = characterIdForLoss
          ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
          : [];
        const inferredLosses = inferItemsLostFromNarrative(
          result.content,
          currentInventory
        );

        if (inferredLosses.length > 0) {
          logger.info(
            `Inferred ${inferredLosses.length} item losses from narrative in generateSkillAcknowledgment`,
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

      if (result.metadata.itemsAcquired && result.metadata.itemsAcquired.length > 0) {
        const characterId = characterIds[0];
        const sessionId = narrativeContext.sessionId;
        if (characterId && sessionId) {
          void processAcquiredItems(
            result.metadata.itemsAcquired,
            characterId,
            sessionId
          );
        }
      }

      if (
        !options?.generationParameters?.disableItemLossProcessing &&
        result.metadata.itemsLost &&
        result.metadata.itemsLost.length > 0
      ) {
        const characterId = characterIds[0];
        const sessionId = narrativeContext.sessionId;
        if (characterId && sessionId) {
          void processLostItems(
            result.metadata.itemsLost,
            characterId,
            sessionId
          );
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to generate skill acknowledgment narrative', {
        error,
      });
      throw new Error('Failed to generate skill acknowledgment narrative');
    }
  }

  async generatePlayerChoices(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[],
    sessionId?: EntityID
  ): Promise<Decision> {
    try {
      const result = await generateChoices(this.geminiClient, {
        worldId,
        narrativeContext,
        characterIds,
        sessionId: sessionId || narrativeContext.sessionId,
        minOptions: 3,
        maxOptions: 3,
        useAlignedChoices: true,
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

  private syncNpcMetadata(
    worldId: string,
    characters?: GeneratedCharacterMetadata[]
  ) {
    syncNpcMetadata(worldId, characters);
  }
}
