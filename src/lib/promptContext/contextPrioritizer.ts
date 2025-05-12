import { ContextElement, PriorityWeights } from './types';

/**
 * Manages token limits and prioritizes context elements based on configurable weights.
 * Ensures the most relevant context is included when space is limited.
 */
export class ContextPrioritizer {
  private defaultWeights: PriorityWeights = {
    'character.current_state': 5,
    'character.attributes': 4,
    'character.skills': 3,
    'character.inventory': 3,
    'character.backstory': 1,
    'character': 4, // Add general character weight
    'world.rules': 4,
    'world.genre': 3,
    'world.description': 2,
    'world.history': 1,
    'world': 3, // Add general world weight
    'event': 3
  };
  
  private weights: PriorityWeights;
  
  /**
   * Creates a new ContextPrioritizer with optional custom weights
   * @param customWeights - Optional custom priority weights to override defaults
   */
  constructor(customWeights?: PriorityWeights) {
    this.weights = { ...this.defaultWeights, ...customWeights };
  }
  
  /**
   * Prioritizes and filters context elements based on token limit.
   * Elements are sorted by priority (weight and timestamp) and included
   * until the token limit is reached.
   * @param elements - Array of context elements to prioritize
   * @param tokenLimit - Maximum number of tokens allowed
   * @returns Array of prioritized context elements that fit within the token limit
   */
  prioritize(elements: ContextElement[], tokenLimit: number): ContextElement[] {
    // First, estimate tokens for each element
    const elementsWithTokens = elements.map(element => ({
      ...element,
      tokens: element.tokens || this.estimateTokens(element.content)
    }));
    
    // Sort by priority (higher weight and more recent timestamp first)
    const sorted = elementsWithTokens.sort((a, b) => {
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // If same priority, sort by timestamp (more recent first)
      if (a.timestamp && b.timestamp) {
        return b.timestamp - a.timestamp;
      }
      
      return 0;
    });
    
    // Include elements that fit within token limit
    const result: ContextElement[] = [];
    let totalTokens = 0;
    
    for (const element of sorted) {
      if (totalTokens + element.tokens <= tokenLimit) {
        result.push(element);
        totalTokens += element.tokens;
      } else if (result.length === 0) {
        // If no elements fit, include truncated version of highest priority
        const truncatedContent = this.truncateContent(element.content, tokenLimit);
        result.push({
          ...element,
          content: truncatedContent,
          truncated: true,
          tokens: this.estimateTokens(truncatedContent)
        });
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Calculates the priority score for a context element.
   * Uses the element's weight if specified, otherwise matches against
   * configured weights based on element type.
   * @param element - Context element to calculate priority for
   * @returns Priority score (higher is more important)
   */
  calculatePriority(element: ContextElement): number {
    if (element.weight !== undefined) {
      return element.weight;
    }
    
    // Find the most specific matching weight
    const typeKeys = Object.keys(this.weights).filter(key => element.type.startsWith(key));
    if (typeKeys.length === 0) {
      return 1; // Default weight
    }
    
    // Use the most specific match
    const mostSpecificKey = typeKeys.reduce((a, b) => a.length > b.length ? a : b);
    return this.weights[mostSpecificKey];
  }
  
  /**
   * Estimates the token count for a piece of content.
   * Uses a simple MVP approach of approximately 4 characters per token.
   * @param content - Text content to estimate tokens for
   * @returns Estimated number of tokens
   */
  estimateTokens(content: string): number {
    // Simple MVP estimation: approximately 4 characters per token
    return Math.ceil(content.length / 4);
  }
  
  /**
   * Truncates content to fit within a maximum token limit.
   * Adds ellipsis to indicate truncation.
   * @param content - Content to truncate
   * @param maxTokens - Maximum number of tokens allowed
   * @returns Truncated content with ellipsis if truncated
   * @private
   */
  private truncateContent(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4; // Using our simple estimation
    if (content.length <= maxChars) {
      return content;
    }
    
    return content.substring(0, maxChars - 3) + '...';
  }
}
