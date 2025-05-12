import { ContextBuilder } from './contextBuilder';
import { ContextPrioritizer } from './contextPrioritizer';
import { ContextOptions, ContextElement } from './types';

/**
 * Manages the generation of AI prompt context by coordinating between
 * the ContextBuilder and ContextPrioritizer. Provides the main entry point
 * for generating context with proper formatting and prioritization.
 */
export class PromptContextManager {
  private contextBuilder: ContextBuilder;
  private contextPrioritizer: ContextPrioritizer;
  
  /**
   * Creates a new PromptContextManager instance
   */
  constructor() {
    this.contextBuilder = new ContextBuilder();
    this.contextPrioritizer = new ContextPrioritizer();
  }
  
  /**
   * Generates context for AI prompts based on provided options.
   * Builds context elements from world and character data, adds events
   * and current situation, then prioritizes based on token limits.
   * @param options - Context generation options
   * @returns Generated context string formatted for AI consumption
   */
  generateContext(options: ContextOptions): string {
    const elements: ContextElement[] = [];
    
    // Build world context elements
    if (options.world) {
      const worldContext = this.contextBuilder.buildWorldContext(options.world);
      elements.push({
        type: 'world',
        content: worldContext,
        weight: this.getWeightForPromptType('world', options.promptType)
      });
    }
    
    // Build character context elements
    if (options.character) {
      const characterContext = this.contextBuilder.buildCharacterContext(options.character);
      elements.push({
        type: 'character',
        content: characterContext,
        weight: this.getWeightForPromptType('character', options.promptType)
      });
    }
    
    // Add recent events
    if (options.recentEvents && options.recentEvents.length > 0) {
      const eventsSection = this.buildEventsSection(options.recentEvents);
      elements.push({
        type: 'event',
        content: eventsSection,
        weight: this.getWeightForPromptType('event', options.promptType)
      });
    }
    
    // Add current situation for decision prompts
    if (options.currentSituation && options.promptType === 'decision') {
      elements.push({
        type: 'situation',
        content: `Current Situation: ${options.currentSituation}`,
        weight: 5 // High priority for decisions
      });
    }
    
    // Prioritize and limit based on tokens
    const tokenLimit = options.tokenLimit || 1000; // Default to 1000 tokens
    const prioritized = this.contextPrioritizer.prioritize(elements, tokenLimit);
    
    // Combine all prioritized elements
    return prioritized.map(element => element.content).join('\n\n');
  }
  
  /**
   * Gets the priority weight for an element type based on the prompt type.
   * Different prompt types prioritize different context elements.
   * @param elementType - Type of context element (world, character, event)
   * @param promptType - Type of prompt being generated (narrative, decision, summary)
   * @returns Priority weight for the element type
   * @private
   */
  private getWeightForPromptType(elementType: string, promptType?: string): number {
    if (!promptType) return 3; // Default weight
    
    // Different weights based on prompt type
    const weights: { [key: string]: { [key: string]: number } } = {
      narrative: {
        world: 3,
        character: 4,
        event: 5
      },
      decision: {
        world: 2,
        character: 5,
        event: 4
      },
      summary: {
        world: 2,
        character: 3,
        event: 5
      }
    };
    
    return weights[promptType]?.[elementType] || 3;
  }
  
  /**
   * Builds a formatted section for recent events
   * @param events - Array of recent event strings
   * @returns Formatted events section
   * @private
   */
  private buildEventsSection(events: string[]): string {
    const lines = ['## Recent Events:'];
    events.forEach(event => lines.push(`- ${event}`));
    return lines.join('\n');
  }
}
