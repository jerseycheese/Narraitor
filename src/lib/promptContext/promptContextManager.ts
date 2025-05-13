import { ContextBuilder } from './contextBuilder';
import { ContextPrioritizer } from './contextPrioritizer';
import { ContextOptions, ContextElement } from './types';
import { estimateTokenCount } from './tokenUtils';

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
   * Manages the generation of AI prompt context by coordinating between
   * the ContextBuilder and ContextPrioritizer. Provides the main entry point
   * for generating context with proper formatting and prioritization.
   *
   * The process involves:
   * 1. Estimating the initial token count of all potential context elements.
   * 2. Building individual context elements (world, character, events, situation)
   *    using the ContextBuilder, assigning weights and timestamps.
   * 3. Prioritizing these elements based on their weight and recency using the ContextPrioritizer.
   * 4. Combining the prioritized elements into a single markdown string.
   * 5. Truncating elements from the lowest priority if the combined context exceeds the token limit.
   * 6. Performing a final basic compression/truncation if necessary (fallback).
   * 7. Returning the final context string and relevant metrics.
   *
   * @param options - Context generation options
   * @returns An object containing the final context string and metrics
   */
  async generateContext(options: ContextOptions): Promise<{
    context: string;
    estimatedTokenCount: number;
    finalTokenCount: number;
    contextRetentionPercentage: number;
  }> {
    const elements: ContextElement[] = [];
    const now = Date.now();

    // Estimate initial token count of all potential context elements
    const estimatedTokenCount = this.estimateContextOptionsTokens(options);

    // Build context elements using ContextBuilder
    if (options.world) {
      elements.push({
        type: 'world',
        content: this.contextBuilder.buildWorldContext(options.world),
        weight: this.getWeightForPromptType('world', options.promptType),
        timestamp: now - 1000 // Slightly older than current time
      });
    }

    if (options.character) {
      elements.push({
        type: 'character',
        content: this.contextBuilder.buildCharacterContext(options.character),
        weight: this.getWeightForPromptType('character', options.promptType),
        timestamp: now - 500 // More recent than world, but older than events
      });
    }

    // Add recent events with timestamps to reflect recency
    if (options.recentEvents && options.recentEvents.length > 0) {
      // Process each event individually to allow for proper prioritization
      options.recentEvents.forEach((event, index) => {
        // More recent events (later in the array) get higher timestamps
        const eventTimestamp = now + (index * 100);
        elements.push({
          type: 'event',
          content: `- ${event}`,
          weight: this.getWeightForPromptType('event', options.promptType),
          timestamp: eventTimestamp
        });
      });
    }

    // Add current situation for decision prompts
    if (options.currentSituation) {
      elements.push({
        type: 'situation',
        content: `Current Situation: ${options.currentSituation}`,
        weight: options.promptType === 'decision' ? 5 : 3, // High priority for decisions
        timestamp: now + 100 // Most recent of all
      });
    }

    const tokenLimit = options.tokenLimit || 1000; // Default to 1000 tokens

    // Prioritize elements using ContextPrioritizer based on weight and recency
    const prioritizedElements = this.contextPrioritizer.prioritize(elements.map(element => ({
      ...element,
      tokens: estimateTokenCount(element.content) // Pass elements with tokens to prioritizer
    })), tokenLimit);

    // Combine the prioritized elements into a single context string
    let currentContext = this.combineElements(prioritizedElements);
    let currentTokenCount = estimateTokenCount(currentContext);

    // If the combined context exceeds the token limit, remove elements
    // starting from the lowest priority until we're under the limit.
    // This is the primary truncation step.
    if (currentTokenCount > tokenLimit) {
      // Sort by priority (lower priority first to remove them first)
      const sortedForRemoval = [...prioritizedElements].sort((a, b) => {
        const priorityA = this.calculatePriority(a);
        const priorityB = this.calculatePriority(b);

        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Lower priority first
        }

        // If same priority, sort by timestamp (older first)
        if (a.timestamp && b.timestamp) {
          return a.timestamp - b.timestamp;
        }

        return 0;
      });

      // Remove elements one by one until we're under the limit
      while (currentTokenCount > tokenLimit && sortedForRemoval.length > 0) {
        const elementToRemove = sortedForRemoval.shift();
        if (!elementToRemove) break;

        // Remove this element from prioritizedElements
        const index = prioritizedElements.findIndex(e =>
          e.type === elementToRemove.type &&
          e.content === elementToRemove.content &&
          e.timestamp === elementToRemove.timestamp
        );

        if (index !== -1) {
          prioritizedElements.splice(index, 1);
          // Recombine and recalculate
          currentContext = this.combineElements(prioritizedElements);
          currentTokenCount = estimateTokenCount(currentContext);
        }
      }
    }

    // The compression step is minimal as per instructions and primarily a fallback.
    // If truncation is working correctly, this block should ideally not be reached.
    // It performs a final character-based truncation if the token count is still over.
    if (currentTokenCount > tokenLimit) {
        currentContext = this.compressContext(currentContext, tokenLimit);
        currentTokenCount = estimateTokenCount(currentContext);
    }

    const finalTokenCount = currentTokenCount;
    const contextRetentionPercentage = estimatedTokenCount > 0 ?
      (finalTokenCount / estimatedTokenCount) * 100 : 100;

    return {
      context: currentContext,
      estimatedTokenCount,
      finalTokenCount,
      contextRetentionPercentage,
    };
  }

  /**
   * Estimates the total token count for all context options.
   *
   * Calculates token usage for world data, character data, recent events,
   * and current situation by converting each to its string representation
   * and estimating tokens. This provides an initial estimate before
   * prioritization and truncation.
   *
   * NOTE: This estimation currently uses JSON.stringify for world and character
   * data, which may not perfectly match the token count of the final markdown
   * output generated by ContextBuilder. This is a known limitation for the MVP.
   *
   * @param options - Context generation options containing world, character, events, and situation data
   * @returns Total estimated token count across all context elements
   * @private
   */
  private estimateContextOptionsTokens(options: ContextOptions): number {
    let totalTokens = 0;
    if (options.world) {
      totalTokens += estimateTokenCount(`World: ${JSON.stringify(options.world)}`);
    }
    if (options.character) {
      totalTokens += estimateTokenCount(`Character: ${JSON.stringify(options.character)}`);
    }
    if (options.recentEvents && options.recentEvents.length > 0) {
      totalTokens += estimateTokenCount('## Recent Events:\n' + options.recentEvents.map((event: string) => `- ${event}`).join('\n'));
    }
    if (options.currentSituation) {
      totalTokens += estimateTokenCount(`Current Situation: ${options.currentSituation}`);
    }
    return totalTokens;
  }

  /**
   * Gets the priority weight for a context element based on prompt type.
   *
   * Different AI prompt types (narrative, decision, summary) require different
   * emphasis on context elements. For example, decision prompts prioritize
   * character and situation information, while summary prompts emphasize events.
   * This method returns the appropriate weight based on these relationships.
   *
   * @param elementType - Type of context element ('world', 'character', 'event', 'situation')
   * @param promptType - Type of prompt being generated ('narrative', 'decision', 'summary')
   * @returns Priority weight value (higher values indicate higher importance)
   * @private
   */
  private getWeightForPromptType(elementType: string, promptType?: string): number {
    if (!promptType) return 3; // Default weight

    // Different weights based on prompt type
    const weights: { [key: string]: { [key: string]: number } } = {
      narrative: {
        world: 5,
        character: 4,
        event: 3,
        situation: 4
      },
      decision: {
        world: 4,
        character: 5,
        event: 3,
        situation: 5
      },
      summary: {
        world: 4,
        character: 3,
        event: 5,
        situation: 4
      }
    };

    return weights[promptType]?.[elementType] || 3;
  }

  /**
   * Calculates the priority score for a context element based on its weight.
   * Used for determining which elements to keep when truncation is needed.
   *
   * @param element - Context element to calculate priority for
   * @returns Priority score (higher values indicate higher importance)
   * @private
   */
  private calculatePriority(element: ContextElement): number {
    return element.weight || this.getWeightForPromptType(element.type, 'narrative');
  }

  /**
   * Builds a formatted markdown section for recent events.
   *
   * Creates a consistent format for the events section with a header
   * and bullet points for each event, making the context more readable
   * and structured for the AI model.
   *
   * @param events - Array of recent event strings to format
   * @returns Formatted markdown string with events as bullet points
   * @private
   */
  private buildEventsSection(events: string[]): string {
    const lines = ['## Recent Events:'];
    events.forEach(event => lines.push(`- ${event}`));
    return lines.join('\n');
  }

  /**
   * Combines prioritized context elements into a formatted context string.
   *
   * This method organizes elements by type (world, character, event, situation)
   * and formats them into appropriate sections with proper spacing and structure.
   * Elements of the same type are grouped together to maintain logical coherence
   * in the final context.
   *
   * @param elements - Array of prioritized context elements to combine
   * @returns Formatted context string with all elements properly organized
   * @private
   */
  private combineElements(elements: ContextElement[]): string {
    // Group elements by type
    const groupedElements: { [key: string]: ContextElement[] } = {};

    elements.forEach(element => {
      const type = element.type;
      if (!groupedElements[type]) {
        groupedElements[type] = [];
      }
      groupedElements[type].push(element);
    });

    const sections: string[] = [];

    // Process world elements
    if (groupedElements['world']) {
      sections.push(groupedElements['world'].map(e => e.content).join('\n\n'));
    }

    // Process character elements
    if (groupedElements['character']) {
      sections.push(groupedElements['character'].map(e => e.content).join('\n\n'));
    }

    // Process event elements
    if (groupedElements['event']) {
      sections.push('## Recent Events:\n' + groupedElements['event'].map(e => e.content).join('\n'));
    }

    // Process situation elements
    if (groupedElements['situation']) {
      sections.push(groupedElements['situation'].map(e => e.content).join('\n\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Compresses context content to fit within the specified token limit.
   *
   * This is a simplified implementation for the MVP that primarily performs
   * truncation when content exceeds the token limit. In a production system,
   * this would use more sophisticated techniques like summarization or
   * selective content removal based on importance.
   *
   * @param content - The context content to compress
   * @param tokenLimit - Maximum number of tokens allowed
   * @returns Compressed content that fits within the token limit
   * @private
   */
  private compressContext(content: string, tokenLimit: number): string {
      // This is a very basic compression - essentially just a final truncation check.
      // A real compression might summarize, remove less important sentences, etc.
      const currentTokens = estimateTokenCount(content);
      if (currentTokens <= tokenLimit) {
          return content;
      }

      // Fallback truncation if needed after initial truncation/prioritization
      const charsPerToken = content.length / currentTokens;
      const charsToKeep = Math.floor(tokenLimit * charsPerToken);
      return content.substring(0, charsToKeep) + '...';
  }
}
