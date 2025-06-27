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
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { TemplateGenerator, WorldTemplate } from './templateGenerator';
import { TemplateGenerationContext } from './templatePrompts';
import { PersonalizationEngine } from './personalizationEngine';
import { playerDecisionTracker } from './playerDecisionTracker';

export class NarrativeGenerator {
  private choiceGenerator: ChoiceGenerator;
  private templateGenerator: TemplateGenerator;
  private personalizationEngine: PersonalizationEngine;
  
  constructor(private geminiClient: AIClient) {
    this.choiceGenerator = new ChoiceGenerator(geminiClient);
    this.templateGenerator = new TemplateGenerator(geminiClient);
    this.personalizationEngine = new PersonalizationEngine();
  }

  /**
   * Enhances a prompt with lore context for the given world
   */
  private enhancePromptWithLore(prompt: string, worldId: EntityID): string {
    const loreContext = getLoreContextForPrompt(worldId);
    return prompt + loreContext;
  }

  /**
   * Enhances a prompt with detailed tone settings for consistent narrative style
   */
  private enhancePromptWithToneSettings(prompt: string, world: World): string {
    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
    
    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    return prompt + detailedInstructions;
  }

  /**
   * Enhances a prompt with personalized character context
   */
  private enhancePromptWithPersonalization(
    prompt: string,
    worldId: EntityID,
    characterIds: string[]
  ): string {
    try {
      const world = this.getWorld(worldId);
      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;

      if (!playerCharacter) {
        return prompt;
      }

      // Get player decisions for this world
      const decisions = playerDecisionTracker.getWorldDecisions(worldId);
      
      // Create personalized context
      const personalizedContext = this.personalizationEngine.createPersonalizedContext(
        playerCharacter,
        world,
        decisions,
        [], // relationships - future enhancement
        [], // goals - future enhancement
        []  // narrative history - future enhancement
      );

      // Generate enhancement text
      const enhancementText = this.personalizationEngine.generateNarrativeEnhancement(personalizedContext);
      
      if (enhancementText.trim()) {
        return `${prompt}\n\n${enhancementText}`;
      }

      return prompt;
    } catch (error) {
      console.warn('Failed to add personalization:', error);
      return prompt;
    }
  }

  async generateSegment(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    try {
      const world = this.getWorld(request.worldId);
      const template = this.getTemplate(request.generationParameters?.segmentType || 'scene');
      
      const context = this.buildContext(world, request);
      const prompt = template(context);
      
      // Add tone settings, lore context, and personalization to prompt
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(prompt, world);
      const loreEnhancedPrompt = this.enhancePromptWithLore(toneEnhancedPrompt, request.worldId);
      const fullyEnhancedPrompt = this.enhancePromptWithPersonalization(
        loreEnhancedPrompt,
        request.worldId,
        request.characterIds || []
      );

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      
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
      
      const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
      
      const context = {
        worldName: world.name,
        worldDescription: world.description,
        genre: world.genre,
        tone: toneSettings.narrativeStyle,
        attributes: world.attributes,
        characterIds,
        playerCharacterName: playerCharacter?.name,
        playerCharacterBackground: playerCharacter?.background,
        toneSettings: toneSettings
      };

      const prompt = template(context);
      
      // Add tone settings, lore context, and personalization to initial scene
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(prompt, world);
      const loreEnhancedPrompt = this.enhancePromptWithLore(toneEnhancedPrompt, worldId);
      const fullyEnhancedPrompt = this.enhancePromptWithPersonalization(
        loreEnhancedPrompt,
        worldId,
        characterIds
      );
      
      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      
      // Extract structured lore from initial scene
      if (response.content) {
        try {
          const existingLoreContext = getLoreContextForPrompt(worldId);
          const structuredLore = await extractStructuredLore(response.content, existingLoreContext);
          
          // Import lore store dynamically to avoid circular dependency
          const { useLoreStore } = await import('@/state/loreStore');
          const { addStructuredLore } = useLoreStore.getState();
          addStructuredLore(structuredLore, worldId);
        } catch {
          // Failed to extract structured lore - this is non-critical
          // Continue with narrative generation without lore extraction
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
      genre: world.genre,
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
    
    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
    
    // Build character skill context for AI
    let characterSkillContext = '';
    if (playerCharacter && world.skills && playerCharacter.skills.length > 0) {
      characterSkillContext = `
CHARACTER ABILITIES:
${playerCharacter.skills.map(skill => {
  const worldSkill = world.skills?.find(ws => ws.id === skill.worldSkillId);
  return `- ${worldSkill?.name || skill.name}: Level ${skill.level}`;
}).join('\n')}`;
    }
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.genre,
      tone: toneSettings.narrativeStyle,
      attributes: world.attributes,
      characterIds: request.characterIds,
      playerCharacterName: playerCharacter?.name,
      playerCharacterBackground: playerCharacter?.background,
      sessionId: request.sessionId,
      narrativeContext: request.narrativeContext,
      generationParameters: request.generationParameters,
      toneSettings: toneSettings,
      // Enhanced skill context for narrative generation
      characterSkillContext,
      worldSkills: world.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
        description: skill.description
      })) || []
    };
  }

  private formatResponse(response: { content?: string; tokenUsage?: number }, segmentType: string): NarrativeGenerationResult {
    let actualContent = response.content || '';
    let extractedMetadata: { location?: string; mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral'; tags?: string[]; characterIds?: string[] } = {};
    
    // Try to parse JSON response if present
    if (actualContent.includes('```json') || actualContent.startsWith('{') || actualContent.includes('"content":')) {
      try {
        let jsonStr = actualContent.trim();
        
        // Handle markdown code blocks
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```\s*/, '').replace(/\s*```/, '');
        }
        
        // Clean up any surrounding text that might interfere
        jsonStr = jsonStr.trim();
        
        // Find JSON object boundaries if there's surrounding text
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        } else if (jsonStart !== -1) {
          // Handle incomplete JSON by extracting content field directly
          const contentMatch = jsonStr.match(/"content"\s*:\s*"([\s\S]*?)(?:",|\s*$)/);
          if (contentMatch && contentMatch[1]) {
            actualContent = contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
            // Skip JSON.parse and continue with extracted content
          } else {
            throw new Error('Incomplete JSON without extractable content');
          }
        } else {
          throw new Error('No JSON structure found');
        }
        
        // Only parse if we have a complete JSON structure
        if (jsonEnd !== -1) {
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
        }
      } catch (parseError) {
        console.warn('Could not parse AI JSON response, attempting regex extraction:', parseError);
        console.warn('Raw content that failed to parse:', actualContent.substring(0, 200) + '...');
        
        // Try regex extraction as fallback for malformed JSON
        try {
          // Look for content field - handle malformed JSON with unescaped quotes
          // Find content field and extract everything until the next field or end
          const contentStartMatch = actualContent.match(/"content"\s*:\s*"(.+?)"\s*,\s*"/);
          if (contentStartMatch && contentStartMatch[1]) {
            actualContent = contentStartMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\\\/g, '\\');
          } else {
            // Try alternative extraction: find content field and extract until next JSON field
            const altContentMatch = actualContent.match(/"content"\s*:\s*"([^"]*(?:"[^"]*"[^"]*)*)"/);
            if (altContentMatch && altContentMatch[1]) {
              actualContent = altContentMatch[1];
            } else {
              // Final attempt: extract everything between "content": " and the next field pattern
              const finalContentMatch = actualContent.match(/"content"\s*:\s*"(.+?)"\s*,\s*"(?:type|metadata)/);
              if (finalContentMatch && finalContentMatch[1]) {
                actualContent = finalContentMatch[1];
              }
            }
          }
          
          // Try to extract location from metadata
          const locationMatch = actualContent.match(/"location"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (locationMatch && locationMatch[1]) {
            extractedMetadata.location = locationMatch[1].replace(/\\"/g, '"');
          }
          
          // Try to extract mood
          const moodMatch = actualContent.match(/"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (moodMatch && moodMatch[1]) {
            extractedMetadata.mood = this.validateMood(moodMatch[1]);
          }
        } catch (regexError) {
          console.warn('Regex extraction also failed:', regexError);
        }
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
      return world?.genre?.toLowerCase() || null;
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
   * Generate narrative that acknowledges skill usage
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
      const world = this.getWorld(worldId);
      const template = this.getTemplate('skillAcknowledgment');
      
      // Get character details
      const { characters } = useCharacterStore.getState();
      const playerCharacterId = characterIds[0];
      const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;
      
      const context = {
        worldName: world.name,
        genre: world.genre,
        narrativeContext,
        playerCharacterName: playerCharacter?.name,
        skillUsed,
        customAction
      };

      const prompt = template(context);
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(prompt, world);
      const fullyEnhancedPrompt = this.enhancePromptWithLore(toneEnhancedPrompt, worldId);

      const response = await this.geminiClient.generateContent(fullyEnhancedPrompt);
      
      return this.formatResponse(response, 'scene');
    } catch {
      throw new Error('Failed to generate skill acknowledgment narrative');
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
        useAlignedChoices: false  // Use enhanced playerChoice template with hints and requirements
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

  /**
   * Generate world template using AI
   */
  async generateWorldTemplate(context: TemplateGenerationContext): Promise<WorldTemplate> {
    return this.templateGenerator.generateWorldTemplate(context);
  }

  /**
   * Convert template to world format
   */
  convertTemplateToWorld(template: WorldTemplate): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
    return this.templateGenerator.convertTemplateToWorld(template);
  }
}
