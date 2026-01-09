import { AIClient } from './types';
import { useWorldStore } from '@/state/worldStore';
import { Decision, NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { checkAndRecordLoreMentions } from './loreContextHelper';
import { safeTrim } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { buildChoicePrompt } from './choiceGenerator.prompt';
import { parseChoiceResponse } from './choiceGenerator.parser';
import { generateFallbackChoices } from './choiceGenerator.fallback';

/**
 * Parameters for choice generation
 */
export interface ChoiceGenerationParams {
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  sessionId?: EntityID;
  maxOptions?: number;
  minOptions?: number;
  useAlignedChoices?: boolean;
  includeDecisionHistory?: boolean;
}

/**
 * ChoiceGenerator class handles generating meaningful player choices
 * based on the current narrative context, character attributes, and world settings.
 */
export class ChoiceGenerator {
  constructor(private aiClient: AIClient) {}
  
  /**
   * Generate player choices based on narrative context
   */
  async generateChoices(params: ChoiceGenerationParams): Promise<Decision> {

    try {
      const { worldId, narrativeContext, characterIds, sessionId, maxOptions = 4, minOptions = 3, useAlignedChoices = false, includeDecisionHistory = true } = params;

      const world = this.getWorld(worldId);
      const prompt = buildChoicePrompt({
        world,
        worldId,
        narrativeContext,
        characterIds,
        sessionId,
        useAlignedChoices,
        includeDecisionHistory,
        maxOptions,
      });

      const response = await this.aiClient.generateContent(prompt);
      
      
      if (!response?.content || safeTrim(response?.content ?? '') === '') {
        return generateFallbackChoices(world, narrativeContext);
      }
      
      const decision = parseChoiceResponse(response.content, narrativeContext, world);

      try {
        checkAndRecordLoreMentions(worldId, sessionId, response.content, 'choices');
      } catch (error) {
        // Non-critical: lore mention tracking is dev-only, don't break choice generation
        logger.warn('Failed to record lore mentions:', error);
      }

      // Ensure we have the minimum number of options
      if (decision.options.length < minOptions) {
        const fallbackDecision = generateFallbackChoices(world, narrativeContext);
        const neededOptions = minOptions - decision.options.length;
        
        // Add additional options from fallback to meet minimum
        for (let i = 0; i < neededOptions; i++) {
          if (i < fallbackDecision.options.length) {
            decision.options.push(fallbackDecision.options[i]);
          }
        }
      }
      
      // Limit options to maximum if needed
      if (decision.options.length > maxOptions) {
        decision.options = decision.options.slice(0, maxOptions);
      }

      return decision;
    } catch (error) {
      const errorDetails = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        worldId: params.worldId,
        hasNarrativeContext: !!params.narrativeContext,
        characterIds: params.characterIds,
        maxOptions: params.maxOptions,
        minOptions: params.minOptions
      };
      logger.error('❌ CHOICE GENERATOR ERROR:', errorDetails);
      logger.error('Full error object:', error);
      
      const world = this.getWorld(params.worldId);
      return generateFallbackChoices(world, params.narrativeContext);
    }
  }

  /**
   * Get world data from the store
   */
  private getWorld(worldId: string): World {
    const { worlds } = useWorldStore.getState();
    const world = worlds[worldId];
    
    
    if (!world) {
      logger.error('World not found:', worldId);
      throw new Error(`World not found: ${worldId}`);
    }
    
    return world;
  }
}
