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
import { ChoiceGenerator } from './choiceGenerator';
import { getLoreContextForPrompt, checkAndRecordLoreMentions } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import {
  generateWorldTemplate as generateWorldTemplateFn,
  convertTemplateToWorld as convertTemplateToWorldFn,
  type WorldTemplate,
} from './templateGenerator';
import { TemplateGenerationContext } from './templatePrompts';
import { PersonalizationEngine } from './personalizationEngine';
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
  createRequestBudget,
  limitNarrativeContextToBudget,
  recordRequestCalibration,
} from './narrativeGenerator.budget';
import {
  buildNarrativeContext,
  convertToPersonalizationCharacter,
  enhancePromptWithInventory,
  enhancePromptWithItemAcquisitionInstructions,
  enhancePromptWithItemLossInstructions,
  enhancePromptWithGoalContext,
  enhancePromptWithLore,
  enhancePromptWithPersonalization,
  enhancePromptWithToneSettings,
  type NarrativeStaticContentCache,
} from './narrativeGenerator.prompt';
import { formatNarrativeResponse } from './narrativeGenerator.response';
import { enforceLanguageComplexity } from './narrativeGenerator.languageComplexity';
import { buildNpcRoster, syncNpcMetadata } from './narrativeGenerator.npc';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private personalizationEngine: PersonalizationEngine;

  private staticContentCache: NarrativeStaticContentCache = {
    toneSettings: new Map(),
  };

  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.personalizationEngine = new PersonalizationEngine();
  }

  async generateSegment(
    request: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      const template = this.getTemplate('scene');

      const budget = createRequestBudget();
      const requestForTemplate = budget.isEnabled()
        ? ({
            ...request,
            narrativeContext: limitNarrativeContextToBudget(
              request.narrativeContext,
              budget
            ),
          } as NarrativeGenerationRequest)
        : request;

      const context = buildNarrativeContext(world, requestForTemplate);
      const prompt = template(context);

      const loreContext = getLoreContextForPrompt(request.worldId, request.sessionId, { recordUsage: false });

      const toneEnhancedPrompt = enhancePromptWithToneSettings(
        prompt,
        world,
        this.staticContentCache,
        budget
      );
      const loreEnhancedPrompt = enhancePromptWithLore(
        toneEnhancedPrompt,
        request.worldId,
        request.sessionId,
        budget
      );
      const goalEnhancedPrompt = await enhancePromptWithGoalContext(
        loreEnhancedPrompt,
        request.sessionId,
        budget
      );
      const personalizedPrompt = await enhancePromptWithPersonalization(
        goalEnhancedPrompt,
        request.worldId,
        request.characterIds || [],
        this.personalizationEngine,
        request.sessionId,
        budget
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        personalizedPrompt,
        request.characterIds || [],
        budget
      );

      // Fetch character inventory for loss context
      const characterIdForLoss = request.characterIds?.[0];
      const characterInventory = characterIdForLoss
        ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
        : [];

      const acquisitionEnhancedPrompt = enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt,
        this.staticContentCache,
        budget
      );

      const fullyEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      recordRequestCalibration(budget, fullyEnhancedPrompt, response);

      if (response.content) {
        try {
          if (process.env.NODE_ENV !== 'production') {
            logger.info('[NarrativeGenerator] EXTRACTION: Post-segment', {
              worldId: request.worldId,
              sessionId: request.sessionId,
              contentLength: response.content.length,
            });
          }

          const existingLoreContext = getLoreContextForPrompt(request.worldId, request.sessionId, {
            recordUsage: false,
          });
          const structuredLore = await extractStructuredLore(
            response.content,
            existingLoreContext
          );

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
        } catch (error) {
          logger.error('[NarrativeGenerator] Failed to extract lore:', error);
        }
      }

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
          fullPrompt: fullyEnhancedPrompt,
          templateName: this.getTemplateName(templateType),
          world,
          toneSettings,
          loreContext,
          characterIds: request.characterIds,
          previousSegmentContent: previousSegment?.content,
          previousSegmentType: previousSegment?.type,
          tokenUsage: result.tokenUsage,
          modelUsed: 'gemini-2.0-flash',
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

  async generateInitialScene(
    worldId: string,
    characterIds: string[],
    sessionId?: string,
    options?: { generationParameters?: GenerationParameters }
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      const template = this.getTemplate('initialScene');
      const budget = createRequestBudget();

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
        this.staticContentCache,
        budget
      );
      const loreEnhancedPrompt = enhancePromptWithLore(
        toneEnhancedPrompt,
        worldId,
        sessionId,
        budget
      );
      const personalizedPrompt = await enhancePromptWithPersonalization(
        loreEnhancedPrompt,
        worldId,
        characterIds,
        this.personalizationEngine,
        sessionId,
        budget
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        personalizedPrompt,
        characterIds,
        budget
      );

      // Fetch character inventory for loss context
      const characterIdForLoss = characterIds[0];
      const characterInventory = characterIdForLoss
        ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
        : [];

      const acquisitionEnhancedPrompt = enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt,
        this.staticContentCache,
        budget
      );

      const fullyEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      recordRequestCalibration(budget, fullyEnhancedPrompt, response);

      if (response.content) {
        try {
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
          const structuredLore = await extractStructuredLore(
            response.content,
            existingLoreContext
          );

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
        } catch (error) {
          logger.error(
            '[NarrativeGenerator] Failed to extract lore from initial scene:',
            error
          );
        }
      }

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

    const result = await formatNarrativeResponse(response, 'transition', this.geminiClient);
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
      const budget = createRequestBudget();

      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId
        ? characters[playerCharacterId]
        : null;

      const context = {
        worldName: world.name,
        genre: world.genre,
        narrativeContext: limitNarrativeContextToBudget(narrativeContext, budget),
        playerCharacterName: playerCharacter?.name,
        skillUsed,
        customAction,
      };

      const prompt = template(context);
      const toneEnhancedPrompt = enhancePromptWithToneSettings(
        prompt,
        world,
        this.staticContentCache,
        budget
      );
      const loreEnhancedPrompt = enhancePromptWithLore(
        toneEnhancedPrompt,
        worldId,
        narrativeContext.sessionId,
        budget
      );
      const inventoryEnhancedPrompt = enhancePromptWithInventory(
        loreEnhancedPrompt,
        characterIds,
        budget
      );

      // Fetch character inventory for loss context
      const characterIdForLoss = characterIds[0];
      const characterInventory = characterIdForLoss
        ? useInventoryStore.getState().getCharacterItems(characterIdForLoss)
        : [];

      const acquisitionEnhancedPrompt = enhancePromptWithItemAcquisitionInstructions(
        inventoryEnhancedPrompt,
        this.staticContentCache,
        budget
      );

      const fullyEnhancedPrompt = enhancePromptWithItemLossInstructions(
        acquisitionEnhancedPrompt,
        this.staticContentCache,
        characterInventory
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);

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
      const result = await this.choiceGenerator.generateChoices({
        worldId,
        narrativeContext,
        characterIds,
        sessionId: sessionId || narrativeContext.sessionId,
        minOptions: 3,
        maxOptions: 4,
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
            requirements: [{ type: 'skill', targetId: 'generic-skill-check', operator: 'gte', value: 1 }],
          },
          {
            id: `option-${fallbackId}-2`,
            text: 'Talk to nearby characters',
            alignment: 'lawful',
            requirements: [{ type: 'skill', targetId: 'generic-skill-check', operator: 'gte', value: 1 }],
          },
          {
            id: `option-${fallbackId}-3`,
            text: 'Move to a new location',
            alignment: 'neutral',
            requirements: [{ type: 'skill', targetId: 'generic-skill-check', operator: 'gte', value: 1 }],
          },
        ],
        decisionWeight: 'minor',
        contextSummary: `In ${
          narrativeContext.currentLocation || 'an unknown location'
        }, ${narrativeContext.currentSituation || 'making a decision'}.`,
      };
    }
  }

  async generateWorldTemplate(
    context: TemplateGenerationContext
  ): Promise<WorldTemplate> {
    return generateWorldTemplateFn(this.geminiClient, context);
  }

  convertTemplateToWorld(
    template: WorldTemplate
  ): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return convertTemplateToWorldFn(template);
  }

  private syncNpcMetadata(
    worldId: string,
    characters?: GeneratedCharacterMetadata[]
  ) {
    syncNpcMetadata(worldId, characters);
  }
}
