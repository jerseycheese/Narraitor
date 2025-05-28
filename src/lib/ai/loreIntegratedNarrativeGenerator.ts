/**
 * Enhanced Narrative Generator with Lore Integration
 * Extends the base narrative generator to include lore context
 */

import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useLoreStore } from '../../state/loreStore';
import type {
  NarrativeGenerationRequest,
  NarrativeGenerationResult,
} from '../../types/narrative.types';
import type { LoreContext } from '../../types/lore.types';

export class LoreIntegratedNarrativeGenerator {
  constructor(private geminiClient: AIClient) {}

  /**
   * Generate narrative segment with lore consistency
   */
  async generateSegmentWithLore(
    request: NarrativeGenerationRequest,
    relevantTags: string[] = []
  ): Promise<NarrativeGenerationResult> {
    try {
      // Get lore context
      const loreContext = this.getLoreContext(request.worldId, relevantTags);
      
      // Build enhanced prompt with lore context
      const enhancedPrompt = this.buildLoreEnhancedPrompt(request, loreContext);
      
      // Generate content
      const response = await this.geminiClient.generateContent(enhancedPrompt);
      
      // Extract any new lore facts from the generated content
      this.extractAndStoreLoreFacts(response, request.worldId);
      
      return this.formatResponse(response, request.generationParameters?.segmentType || 'scene');
    } catch (error) {
      throw new Error(`Failed to generate narrative segment with lore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate initial scene with world lore
   */
  async generateInitialSceneWithLore(
    worldId: string,
    characterIds: string[]
  ): Promise<NarrativeGenerationResult> {
    try {
      // Get comprehensive lore context for world setup
      const loreContext = this.getLoreContext(worldId, ['world', 'setting', 'important']);
      
      const request: NarrativeGenerationRequest = {
        worldId,
        context: {
          sessionId: '',
          worldId,
          characterIds,
          currentSegmentId: null,
          previousChoices: [],
          narrativeHistory: [],
          worldContext: null,
          characterContext: null,
        },
        generationParameters: {
          segmentType: 'initialScene',
          includeChoices: true,
        },
      };

      return this.generateSegmentWithLore(request, ['setting', 'world', 'introduction']);
    } catch (error) {
      throw new Error(`Failed to generate initial scene with lore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get relevant lore context for narrative generation
   */
  private getLoreContext(worldId: string, relevantTags: string[]): LoreContext {
    const { getLoreContext } = useLoreStore.getState();
    return getLoreContext(worldId, relevantTags, 15); // Limit to 15 most relevant facts
  }

  /**
   * Build enhanced prompt that includes lore context
   */
  private buildLoreEnhancedPrompt(
    request: NarrativeGenerationRequest,
    loreContext: LoreContext
  ): string {
    const template = narrativeTemplateManager.getTemplate(
      request.generationParameters?.segmentType || 'scene'
    );
    
    // Base context
    const baseContext = {
      worldId: request.worldId,
      characterIds: request.context.characterIds,
      previousChoices: request.context.previousChoices,
      narrativeHistory: request.context.narrativeHistory,
    };

    // Enhanced context with lore
    const enhancedContext = {
      ...baseContext,
      loreContext: {
        summary: loreContext.contextSummary,
        relevantFacts: loreContext.relevantFacts.map(fact => ({
          title: fact.title,
          content: fact.content,
          category: fact.category,
          tags: fact.tags,
        })),
        consistencyNote: this.generateConsistencyNote(loreContext),
      },
    };

    return template(enhancedContext);
  }

  /**
   * Generate a consistency note for the AI
   */
  private generateConsistencyNote(loreContext: LoreContext): string {
    if (loreContext.factCount === 0) {
      return 'No established lore constraints. You have creative freedom to establish new facts.';
    }

    const categories = loreContext.relevantFacts.reduce((acc, fact) => {
      acc[fact.category] = (acc[fact.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryList = Object.entries(categories)
      .map(([cat, count]) => `${count} ${cat}${count > 1 ? 's' : ''}`)
      .join(', ');

    return `IMPORTANT: Maintain consistency with established lore including ${categoryList}. ` +
           `Do not contradict existing facts. When introducing new elements, ensure they fit naturally ` +
           `with the established world. If you must deviate, provide in-world explanation.`;
  }

  /**
   * Extract new lore facts from generated narrative
   */
  private extractAndStoreLoreFacts(generatedContent: string, worldId: string): void {
    try {
      const { extractFactsFromText } = useLoreStore.getState();
      extractFactsFromText(generatedContent, worldId, 'ai_generated');
    } catch (error) {
      console.warn('Failed to extract lore facts from generated content:', error);
      // Don't throw - this is a nice-to-have feature that shouldn't break generation
    }
  }

  /**
   * Format the AI response into a narrative result
   */
  private formatResponse(response: string, segmentType: string): NarrativeGenerationResult {
    // Parse the response to extract narrative content and choices
    const lines = response.split('\n').filter(line => line.trim());
    
    let narrativeContent = '';
    const choices: string[] = [];
    let inChoicesSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('choices:') || line.toLowerCase().includes('options:')) {
        inChoicesSection = true;
        continue;
      }

      if (inChoicesSection) {
        // Extract choice text (remove numbers, bullets, etc.)
        const choiceMatch = line.match(/^[\d\-\*\s]*(.+)$/);
        if (choiceMatch && choiceMatch[1].trim()) {
          choices.push(choiceMatch[1].trim());
        }
      } else {
        narrativeContent += line + '\n';
      }
    }

    // Create narrative segment
    const segment = {
      id: `segment-${Date.now()}`,
      content: narrativeContent.trim(),
      type: segmentType as any,
      choices: choices.map((choice, index) => ({
        id: `choice-${Date.now()}-${index}`,
        text: choice,
        description: '',
        requirements: [],
        consequences: [],
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        generationMethod: 'lore-integrated',
        aiModel: 'gemini',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      segment,
      choices: segment.choices,
      metadata: {
        processingTime: 0, // Would be calculated in real implementation
        tokensUsed: 0, // Would be provided by AI service
        confidence: 0.9, // Default confidence for lore-integrated generation
      },
    };
  }

  /**
   * Check for potential lore conflicts in generated content
   */
  async validateLoreConsistency(
    generatedContent: string, 
    worldId: string
  ): Promise<{ isConsistent: boolean; conflicts: string[] }> {
    try {
      const { searchFacts } = useLoreStore.getState();
      const existingFacts = searchFacts({ worldId, isCanonical: true });
      
      // Simple keyword-based conflict detection
      const conflicts: string[] = [];
      
      for (const fact of existingFacts) {
        // Check for direct contradictions in the content
        const factKeywords = fact.content.toLowerCase().split(' ');
        const contentLower = generatedContent.toLowerCase();
        
        // Look for potential contradictions
        if (fact.category === 'characters') {
          // Check character-related conflicts
          if (contentLower.includes('dead') && fact.content.toLowerCase().includes('alive')) {
            conflicts.push(`Potential conflict: ${fact.title} - generated content may contradict established status`);
          }
        }
        
        if (fact.category === 'locations') {
          // Check location-related conflicts
          if (contentLower.includes('destroyed') && fact.content.toLowerCase().includes('standing')) {
            conflicts.push(`Potential conflict: ${fact.title} - generated content may contradict established state`);
          }
        }
      }
      
      return {
        isConsistent: conflicts.length === 0,
        conflicts,
      };
    } catch (error) {
      console.warn('Failed to validate lore consistency:', error);
      return { isConsistent: true, conflicts: [] };
    }
  }
}