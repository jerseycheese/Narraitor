import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { worldStore } from '@/state/worldStore';
import {
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  NarrativeSegment
} from '@/types/narrative.types';
import { World } from '@/types/world.types';

export class NarrativeGenerator {
  constructor(private geminiClient: AIClient) {}

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
        genre: world.theme,
        tone: 'default',
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
      genre: world.theme,
      tone: 'default',
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
      genre: world.theme,
      tone: 'default',
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
    let parsedResponse: any = { content: '', type: segmentType, metadata: {} };
    
    try {
      // First, try to parse the content as JSON
      if (typeof response.content === 'string') {
        try {
          parsedResponse = JSON.parse(response.content);
        } catch (e) {
          // If parsing fails, use the raw content
          console.log("Failed to parse response as JSON, using raw content");
          parsedResponse = {
            content: response.content || '',
            type: segmentType,
            metadata: {}
          };
        }
      }
    } catch (error) {
      console.error("Error formatting response:", error);
      // Fallback to raw content if anything goes wrong
      parsedResponse = {
        content: response.content || '',
        type: segmentType,
        metadata: {}
      };
    }
    
    return {
      content: parsedResponse.content || '',
      segmentType: (parsedResponse.type || segmentType) as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: parsedResponse.metadata?.characterIds || [],
        location: parsedResponse.metadata?.location || '',
        mood: parsedResponse.metadata?.mood || 'neutral',
        tags: parsedResponse.metadata?.tags || []
      },
      tokenUsage: response.tokenUsage
    };
  }
}