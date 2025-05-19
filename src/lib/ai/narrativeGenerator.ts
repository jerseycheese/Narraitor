import { GeminiClient } from './geminiClient';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { worldStore } from '@/state/worldStore';
import {
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  NarrativeSegment
} from '@/types/narrative.types';
import { World } from '@/types/world.types';

export class NarrativeGenerator {
  constructor(private geminiClient: GeminiClient) {}

  async generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const template = this.getTemplate(request.generationParameters?.segmentType || 'scene');
      
      const context = this.buildContext(world, request);
      const prompt = template(context);

      const response = await this.geminiClient.generateContent(prompt);
      
      return this.formatResponse(response, request.generationParameters?.segmentType || 'scene');
    } catch {
      throw new Error('Failed to generate narrative segment');
    }
  }

  async generateInitialScene(worldId: string, characterIds: string[]): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const template = this.getTemplate('initialScene');
      
      const context = {
        worldName: world.name,
        worldDescription: world.description,
        genre: world.genre,
        tone: world.tone,
        attributes: world.attributes,
        characterIds
      };

      const prompt = template(context);
      const response = await this.geminiClient.generateContent(prompt);
      
      return this.formatResponse(response, 'scene');
    } catch {
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
      tone: world.tone,
      newLocation: to.narrativeContext?.currentLocation
    };

    const prompt = template(context);
    const response = await this.geminiClient.generateContent(prompt);
    
    return this.formatResponse(response, 'transition');
  }

  private getWorld(worldId: string): World {
    const { worlds } = worldStore.getState();
    const world = worlds[worldId];
    
    if (!world) {
      throw new Error(`World not found: ${worldId}`);
    }
    
    return world;
  }

  private getTemplate(segmentType: string) {
    const templateKey = `narrative/${segmentType}`;
    return narrativeTemplateManager.getTemplate(templateKey);
  }

  private buildContext(world: World, request: NarrativeGenerationRequest) {
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.genre,
      tone: world.tone,
      attributes: world.attributes,
      characterIds: request.characterIds,
      sessionId: request.sessionId,
      narrativeContext: request.narrativeContext,
      generationParameters: request.generationParameters
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatResponse(response: any, segmentType: string): NarrativeGenerationResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiResponse = response as { content?: string; metadata?: any; tokenUsage?: any };
    return {
      content: aiResponse.content || '',
      segmentType: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: aiResponse.metadata?.characterIds || [],
        location: aiResponse.metadata?.location,
        mood: aiResponse.metadata?.mood || 'neutral',
        tags: aiResponse.metadata?.tags || []
      },
      tokenUsage: aiResponse.tokenUsage
    };
  }
}