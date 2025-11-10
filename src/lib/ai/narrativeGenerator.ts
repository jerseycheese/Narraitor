/**
 * NarrativeGenerator (Refactored)
 *
 * Streamlined narrative generation coordinator that delegates to specialized modules:
 * - NarrativeContextGateway: Store reads
 * - ContextBuilder: Context assembly
 * - PromptComposer: Prompt enhancement
 * - GenerationPipeline: AI calls and post-processing
 *
 * This refactored version reduces the class from ~2000 lines to ~300 lines
 * by extracting responsibilities into focused, testable modules.
 */

import { AIClient } from './types';
import { NarrativeGenerationRequest, NarrativeGenerationResult, Decision, NarrativeSegment, NarrativeContext } from '@/types/narrative.types';
import { EntityID } from '@/types/common.types';
import { ChoiceGenerator } from './choiceGenerator';
import { TemplateGenerator, WorldTemplate } from './templateGenerator';
import { TemplateGenerationContext } from './templatePrompts';
import { World } from '@/types/world.types';
import { NarrativeContextGateway } from './narrativeContextGateway';
import { ContextBuilder } from './contextBuilder';
import { GenerationPipeline } from './generationPipeline';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import {
  ToneSettingsEnhancer,
  LoreEnhancer,
  GoalContextEnhancer,
  PersonalizationEnhancer,
  InventoryEnhancer,
  ItemAcquisitionEnhancer,
} from './promptComposer/enhancers';

/**
 * Default enhancer chain for most narrative generation
 */
const DEFAULT_ENHANCERS = [
  new ToneSettingsEnhancer(),
  new LoreEnhancer(),
  new GoalContextEnhancer(),
  new PersonalizationEnhancer(),
  new InventoryEnhancer(),
  new ItemAcquisitionEnhancer(),
];

/**
 * Enhancer chain for initial scenes (no goal context initially)
 */
const INITIAL_SCENE_ENHANCERS = [
  new ToneSettingsEnhancer(),
  new LoreEnhancer(),
  new PersonalizationEnhancer(),
  new InventoryEnhancer(),
  new ItemAcquisitionEnhancer(),
];

/**
 * Enhancer chain for skill acknowledgments
 */
const SKILL_ACKNOWLEDGMENT_ENHANCERS = [
  new ToneSettingsEnhancer(),
  new LoreEnhancer(),
  new InventoryEnhancer(),
  new ItemAcquisitionEnhancer(),
];

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private templateGenerator: TemplateGenerator;
  private gateway: NarrativeContextGateway;
  private contextBuilder: ContextBuilder;
  private pipeline: GenerationPipeline;

  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.templateGenerator = new TemplateGenerator(geminiClient);
    this.gateway = new NarrativeContextGateway();
    this.contextBuilder = new ContextBuilder(this.gateway);
    this.pipeline = new GenerationPipeline(geminiClient);
  }

  /**
   * Generate a narrative segment
   *
   * Main entry point for narrative generation. Uses the shared pipeline
   * with the default enhancer chain.
   */
  async generateSegment(
    request: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    try {
      // Build context
      const segmentType = request.generationParameters?.segmentType || 'scene';
      const context = await this.contextBuilder.buildContext(request, segmentType);

      // Run generation pipeline
      return await this.pipeline.generate(context, {
        enhancers: DEFAULT_ENHANCERS,
        processItemAcquisition: !request.generationParameters?.disableItemAcquisitionProcessing,
      });
    } catch (error) {
      throw new Error('Failed to generate narrative segment');
    }
  }

  /**
   * Generate initial scene for a new game session
   *
   * Uses a specialized enhancer chain without goal context
   * since the session is just starting.
   */
  async generateInitialScene(
    worldId: string,
    characterIds: string[],
    sessionId?: string
  ): Promise<NarrativeGenerationResult> {
    try {
      // Build initial scene context
      const context = await this.contextBuilder.buildInitialSceneContext(
        worldId,
        characterIds,
        sessionId
      );

      // Run generation pipeline with initial scene enhancers
      return await this.pipeline.generate(context, {
        enhancers: INITIAL_SCENE_ENHANCERS,
        segmentTypeOverride: 'scene',
      });
    } catch (error) {
      throw new Error('Failed to generate initial scene');
    }
  }

  /**
   * Generate transition between narrative segments
   *
   * Simplified generation for transitions, uses minimal processing.
   */
  async generateTransition(
    from: NarrativeSegment,
    to: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.gateway.getWorld(to.worldId);
      if (!world) {
        throw new Error(`World not found: ${to.worldId}`);
      }

      const template = narrativeTemplateManager.getTemplate('narrative/transition');

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

      // Build simple result for transitions
      return {
        content: response.content || '',
        segmentType: 'transition',
        metadata: {
          characterIds: to.characterIds || [],
          location: to.narrativeContext?.currentLocation || 'Unknown',
          mood: 'neutral',
          tags: ['transition'],
        },
        tokenUsage: response.tokenUsage
          ? {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: response.tokenUsage as number,
            }
          : undefined,
      };
    } catch (error) {
      throw new Error('Failed to generate transition');
    }
  }

  /**
   * Generate skill acknowledgment narrative
   *
   * Acknowledges when the player uses a skill, with success/failure feedback.
   */
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
    }
  ): Promise<NarrativeGenerationResult> {
    try {
      const world = this.gateway.getWorld(worldId);
      if (!world) {
        throw new Error(`World not found: ${worldId}`);
      }

      const template = narrativeTemplateManager.getTemplate('narrative/skillAcknowledgment');

      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId
        ? this.gateway.getCharacter(playerCharacterId)
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

      // Use a subset of enhancers for skill acknowledgment
      const toneEnhancer = new ToneSettingsEnhancer();
      const loreEnhancer = new LoreEnhancer();
      const inventoryEnhancer = new InventoryEnhancer();
      const itemAcquisitionEnhancer = new ItemAcquisitionEnhancer();

      const generationContext = await this.contextBuilder.buildContext(
        {
          worldId,
          characterIds,
          narrativeContext,
          sessionId: narrativeContext.sessionId,
        },
        'skillAcknowledgment'
      );

      // Manually compose prompt (simplified pipeline)
      let enhancedPrompt = prompt;
      enhancedPrompt = toneEnhancer.enhance(enhancedPrompt, generationContext);
      enhancedPrompt = loreEnhancer.enhance(enhancedPrompt, generationContext);
      enhancedPrompt = inventoryEnhancer.enhance(enhancedPrompt, generationContext);
      enhancedPrompt = itemAcquisitionEnhancer.enhance(enhancedPrompt, generationContext);

      const response = await this.geminiClient.generateContent(enhancedPrompt);

      // Use pipeline for post-processing
      return await this.pipeline.generate(generationContext, {
        enhancers: SKILL_ACKNOWLEDGMENT_ENHANCERS,
        segmentTypeOverride: 'action',
      });
    } catch (error) {
      throw new Error('Failed to generate skill acknowledgment narrative');
    }
  }

  /**
   * Generate player choices based on current narrative context
   *
   * Delegates to ChoiceGenerator.
   */
  async generatePlayerChoices(
    worldId: string,
    narrativeContext: NarrativeContext,
    characterIds: string[]
  ): Promise<Decision> {
    try {
      const result = await this.choiceGenerator.generateChoices({
        worldId,
        narrativeContext,
        characterIds,
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: false,
      });

      return result;
    } catch {
      // Return fallback choices
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
        contextSummary: `In ${narrativeContext.currentLocation || 'an unknown location'}, ${narrativeContext.currentSituation || 'making a decision'}.`,
      };
    }
  }

  /**
   * Generate world template using AI
   *
   * Delegates to TemplateGenerator.
   */
  async generateWorldTemplate(
    context: TemplateGenerationContext
  ): Promise<WorldTemplate> {
    return this.templateGenerator.generateWorldTemplate(context);
  }

  /**
   * Convert template to world format
   *
   * Delegates to TemplateGenerator.
   */
  convertTemplateToWorld(
    template: WorldTemplate
  ): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return this.templateGenerator.convertTemplateToWorld(template);
  }
}
