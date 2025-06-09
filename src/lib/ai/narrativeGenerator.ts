import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import {
  Decision,
  NarrativeContext,
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
  NarrativeSegment
} from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { ChoiceGenerator } from './choiceGenerator';
import { getLoreContextForPrompt } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  
  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
  }

  /**
   * Enhances a prompt with lore context for the given world
   */
  private enhancePromptWithLore(prompt: string, worldId: EntityID): string {
    const loreContext = getLoreContextForPrompt(worldId);
    return prompt + loreContext;
  }

  async generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const template = this.getTemplate(request.generationParameters?.segmentType || 'scene');
      
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
          // No fallback - AI extraction or nothing
        }
      }
      
      return this.formatResponse(response, request.generationParameters?.segmentType || 'scene');
    } catch {
      throw new Error('Failed to generate narrative segment');
    }
  }

  async generateInitialScene(worldId: string, characterIds: string[]): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(worldId);
      const template = this.getTemplate('initialScene');
      
      // Get character details
      const { characters } = useCharacterStore.getState();
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
      
      // Add lore context to initial scene
      const enhancedPrompt = this.enhancePromptWithLore(prompt, worldId);
      
      const response = await this.geminiClient.generateContent(enhancedPrompt);
      
      // Extract structured lore from initial scene
      if (response.content) {
        try {
          const existingLoreContext = getLoreContextForPrompt(worldId);
          const structuredLore = await extractStructuredLore(response.content, existingLoreContext);
          
          // Import lore store dynamically to avoid circular dependency
          const { useLoreStore } = await import('@/state/loreStore');
          const { addStructuredLore } = useLoreStore.getState();
          addStructuredLore(structuredLore, worldId);
        } catch (error) {
          console.warn('Failed to extract structured lore from initial scene:', error);
          // No fallback - AI extraction or nothing
        }
      }
      
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
    const { worlds } = useWorldStore.getState();
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
    // Get character details
    const { characters } = useCharacterStore.getState();
    const playerCharacterId = request.characterIds?.[0]; // First character is the player
    const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;
    
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.theme,
      tone: 'default',
      attributes: world.attributes,
      characterIds: request.characterIds,
      playerCharacterName: playerCharacter?.name,
      playerCharacterBackground: playerCharacter?.background,
      sessionId: request.sessionId,
      narrativeContext: request.narrativeContext,
      generationParameters: request.generationParameters
    };
  }

  private formatResponse(response: { content?: string; tokenUsage?: number }, segmentType: string): NarrativeGenerationResult {
    let actualContent = response.content || '';
    let extractedMetadata: { location?: string; mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral'; tags?: string[]; characterIds?: string[] } = {};
    
    // Try to parse JSON response if present
    if (actualContent.includes('```json') || actualContent.startsWith('{')) {
      try {
        let jsonStr = actualContent;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.content) {
          actualContent = parsed.content;
        }
        if (parsed.metadata) {
          extractedMetadata = {
            location: parsed.metadata.location,
            mood: this.validateMood(parsed.metadata.mood),
            tags: Array.isArray(parsed.metadata.tags) ? parsed.metadata.tags : [],
            characterIds: Array.isArray(parsed.metadata.characterIds) ? parsed.metadata.characterIds : []
          };
        }
      } catch (parseError) {
        console.warn('Could not parse AI JSON response, using fallback metadata:', parseError);
      }
    }
    
    // Use extracted metadata or fall back to generated metadata
    const fallbackMood = this.getMoodForGenre(this.getWorldGenre());
    const fallbackLocation = this.getLocationForGenre(this.getWorldGenre());
    
    return {
      content: actualContent,
      segmentType: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        characterIds: extractedMetadata.characterIds || [],
        location: extractedMetadata.location || fallbackLocation,
        mood: extractedMetadata.mood || fallbackMood,
        tags: extractedMetadata.tags || [this.getWorldGenre() || 'fantasy', 'narrative']
      },
      tokenUsage: response.tokenUsage && typeof response.tokenUsage === 'object' 
        ? response.tokenUsage 
        : response.tokenUsage 
          ? { promptTokens: 0, completionTokens: 0, totalTokens: response.tokenUsage as number } 
          : undefined
    };
  }
  
  // Helper methods for mock generation
  private getWorldGenre(): string | null {
    try {
      const world = this.getWorld(useWorldStore.getState().currentWorldId || '');
      return world?.theme?.toLowerCase() || null;
    } catch {
      return null;
    }
  }
  
  private validateMood(mood?: string): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' | undefined {
    const validMoods = ['neutral', 'tense', 'mysterious', 'relaxed', 'action', 'emotional'];
    return validMoods.includes(mood || '') ? mood as 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' : undefined;
  }
  
  private getMoodForGenre(genre?: string | null): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' {
    if (!genre) return 'neutral';
    
    switch(genre.toLowerCase()) {
      case 'horror': return 'tense';
      case 'fantasy': return 'mysterious';
      case 'sci-fi': 
      case 'science fiction': return 'mysterious';
      case 'western': return 'tense';
      case 'cyberpunk': return 'tense';
      case 'post-apocalyptic': return 'tense';
      case 'steampunk': return 'mysterious';
      default: return 'neutral';
    }
  }
  
  private getLocationForGenre(genre?: string | null): string {
    if (!genre) return 'Starting Location';
    
    switch(genre.toLowerCase()) {
      case 'fantasy': return 'Enchanted Forest';
      case 'sci-fi': 
      case 'science fiction': return 'Space Station';
      case 'western': return 'Frontier Town';
      case 'horror': return 'Abandoned Mansion';
      case 'cyberpunk': return 'Neon City';
      case 'post-apocalyptic': return 'Ruins';
      case 'steampunk': return 'Victorian Metropolis';
      default: return 'Starting Location';
    }
  }
  
  /**
   * Generate player choices based on the current narrative context
   */
  async generatePlayerChoices(worldId: string, narrativeContext: NarrativeContext, characterIds: string[]): Promise<Decision> {
    
    try {
      const result = await this.choiceGenerator.generateChoices({
        worldId,
        narrativeContext,
        characterIds,
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: true
      });
      
      
      return result;
    } catch (error) {
      console.error('Error generating player choices:', error);
      
      // Instead of throwing, return fallback choices
      const fallbackId = `decision-fallback-${Date.now()}`;
      return {
        id: fallbackId,
        prompt: "What will you do next?",
        options: [
          { id: `option-${fallbackId}-1`, text: "Investigate further", alignment: 'neutral' },
          { id: `option-${fallbackId}-2`, text: "Talk to nearby characters", alignment: 'lawful' },
          { id: `option-${fallbackId}-3`, text: "Move to a new location", alignment: 'neutral' }
        ],
        decisionWeight: 'minor',
        contextSummary: `In ${narrativeContext.currentLocation || 'an unknown location'}, ${narrativeContext.currentSituation || 'making a decision'}.`
      };
    }
  }
}
