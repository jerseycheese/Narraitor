import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import {
  Decision,
  NarrativeContext,
  NarrativeGenerationRequest,
  NarrativeGenerationResult
} from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { ChoiceGenerator } from './choiceGenerator';
import { getLoreContextForPrompt } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';
import { FallbackContentManager } from '@/lib/narrative/fallback/FallbackContentManager';
import { ServiceMonitor } from './ServiceMonitor';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private fallbackManager: FallbackContentManager;
  private serviceMonitor: ServiceMonitor;
  private maxRetries = 2;
  
  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.fallbackManager = new FallbackContentManager();
    this.serviceMonitor = new ServiceMonitor(geminiClient);
  }

  /**
   * Enhances a prompt with lore context for the given world
   */
  private enhancePromptWithLore(prompt: string, worldId: EntityID): string {
    const loreContext = getLoreContextForPrompt(worldId);
    return prompt + loreContext;
  }

  async generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    const world = this.getWorld(request.worldId);
    const segmentType = request.generationParameters?.segmentType || 'scene';
    
    // Try AI generation with retries
    let lastError: Error | null = null;
    let retryAttempts = 0;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        retryAttempts = attempt;
        const template = this.getTemplate(segmentType);
        const context = this.buildContext(world, request);
        const prompt = template(context);
        
        // Add lore context to prompt
        const enhancedPrompt = this.enhancePromptWithLore(prompt, request.worldId);
        const response = await this.geminiClient.generateContent(enhancedPrompt);
        
        // Extract structured lore from generated narrative
        if (response.content) {
          try {
            const existingLoreContext = getLoreContextForPrompt(request.worldId);
            const structuredLore = await extractStructuredLore(response.content, existingLoreContext);
            
            // Import lore store dynamically to avoid circular dependency
            const { useLoreStore } = await import('@/state/loreStore');
            const { addStructuredLore } = useLoreStore.getState();
            addStructuredLore(structuredLore, request.worldId, request.sessionId);
          } catch (error) {
            console.warn('Failed to extract structured lore:', error);
          }
        }
        
        return this.formatResponse(response, segmentType, true);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on final attempt
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    // AI generation failed, use fallback
    return this.generateFallbackContent(
      world,
      request,
      segmentType,
      lastError,
      retryAttempts
    );
  }

  async generateInitialScene(worldId: string, characterIds: string[]): Promise<NarrativeGenerationResult> {
    const world = this.getWorld(worldId);
    
    // Try AI generation with retries
    let lastError: Error | null = null;
    let retryAttempts = 0;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        retryAttempts = attempt;
        const template = this.getTemplate('initialScene');
        
        // Get character details
        const { characters } = characterStore.getState();
        const playerCharacterId = characterIds[0]; // First character is the player
        const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;
        
        const context = {
          worldName: world.name,
          worldDescription: world.description,
          genre: world.theme,
          tone: 'default',
          attributes: world.attributes,
          characterIds,
          playerCharacterName: playerCharacter?.name,
          playerCharacterBackground: playerCharacter?.background
        };

        const prompt = template(context);
        const enhancedPrompt = this.enhancePromptWithLore(prompt, worldId);
        const response = await this.geminiClient.generateContent(enhancedPrompt);
        
        // Extract structured lore from initial scene
        if (response.content) {
          try {
            const existingLoreContext = getLoreContextForPrompt(worldId);
            const structuredLore = await extractStructuredLore(response.content, existingLoreContext);
            
            const { useLoreStore } = await import('@/state/loreStore');
            const { addStructuredLore } = useLoreStore.getState();
            addStructuredLore(structuredLore, worldId);
          } catch (error) {
            console.warn('Failed to extract structured lore from initial scene:', error);
          }
        }
        
        return this.formatResponse(response, 'initialScene', true);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    // Create minimal context for fallback
    const fallbackContext: NarrativeContext = {
      worldId,
      currentSceneId: 'initial',
      characterIds,
      previousSegments: [],
      currentTags: ['beginning'],
      sessionId: 'initial-session'
    };
    
    const fallbackRequest: NarrativeGenerationRequest = {
      worldId,
      sessionId: 'initial-session',
      characterIds,
      narrativeContext: fallbackContext,
      generationParameters: { segmentType: 'scene' }
    };
    
    return this.generateFallbackContent(
      world,
      fallbackRequest,
      'initial',
      lastError,
      retryAttempts
    );
  }

  /**
   * Generate fallback content when AI is unavailable
   */
  private async generateFallbackContent(
    world: World,
    request: NarrativeGenerationRequest,
    segmentType: string,
    error: Error | null,
    retryAttempts: number
  ): Promise<NarrativeGenerationResult> {
    const context = request.narrativeContext || this.buildMinimalContext(world, request);
    const fallbackContent = this.fallbackManager.getContent(segmentType, context, world);
    
    if (!fallbackContent) {
      throw new Error('Failed to generate narrative segment');
    }
    
    const fallbackReason = this.determineFallbackReason(error);
    
    return {
      content: fallbackContent.content,
      segmentType: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: request.characterIds,
        tags: fallbackContent.tags,
        timestamp: new Date().toISOString(),
        isAIGenerated: false,
        fallbackReason,
        contentId: fallbackContent.id,
        retryAttempts
      },
      choices: fallbackContent.choices?.map(choice => ({
        text: choice.text,
        outcome: choice.outcome,
        tags: choice.tags
      })),
      isAIGenerated: false,
      fallbackReason
    };
  }

  /**
   * Determine the reason for fallback based on error
   */
  private determineFallbackReason(error: Error | null): 'service_unavailable' | 'timeout' | 'error' | 'rate_limit' {
    if (!error) return 'error';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate limit') || message.includes('rate_limit')) return 'rate_limit';
    if (message.includes('unavailable')) return 'service_unavailable';
    if (message.includes('service')) return 'service_unavailable';
    
    return 'error';
  }

  /**
   * Build minimal context when not provided
   */
  private buildMinimalContext(world: World, request: NarrativeGenerationRequest): NarrativeContext {
    return {
      worldId: request.worldId,
      currentSceneId: 'scene-' + Date.now(),
      characterIds: request.characterIds,
      previousSegments: [],
      currentTags: [],
      sessionId: request.sessionId
    };
  }

  private getWorld(worldId: string): World {
    const { worlds } = worldStore.getState();
    const world = worlds[worldId];
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }
    return world;
  }

  private getTemplate(type: string) {
    return narrativeTemplateManager.getTemplate(type);
  }

  private buildContext(world: World, request: NarrativeGenerationRequest): Record<string, unknown> {
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.theme,
      tone: 'default',
      narrativeContext: request.narrativeContext,
      generationParameters: request.generationParameters
    };
  }

  private formatResponse(response: { content: string }, segmentType: string, isAIGenerated: boolean): NarrativeGenerationResult {
    return {
      content: response.content,
      segmentType: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: [],
        tags: [],
        isAIGenerated
      },
      isAIGenerated
    };
  }

  // Choices are now handled through the existing ChoiceGenerator
  async generateChoices(params: {
    worldId: string;
    narrativeContext: NarrativeContext;
    characterIds: string[];
  }): Promise<Decision> {
    return this.choiceGenerator.generateChoices(params);
  }
}