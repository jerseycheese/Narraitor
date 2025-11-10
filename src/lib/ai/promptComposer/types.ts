/**
 * PromptComposer Types
 *
 * Defines the interface for modular prompt enhancement
 */

import { NarrativeGenerationContext } from '../narrativeGenerationContext';

/**
 * A function that enhances a prompt with specific context
 */
export interface PromptEnhancer {
  /**
   * Enhance a prompt with additional context
   * @param prompt The base prompt to enhance
   * @param context The narrative generation context
   * @returns The enhanced prompt
   */
  enhance(prompt: string, context: NarrativeGenerationContext): string | Promise<string>;

  /**
   * Optional name for debugging and logging
   */
  readonly name?: string;
}

/**
 * Options for prompt composition
 */
export interface PromptCompositionOptions {
  /**
   * List of enhancers to apply in order
   */
  enhancers: PromptEnhancer[];

  /**
   * Whether to skip enhancers that fail
   * Default: true
   */
  skipFailedEnhancers?: boolean;
}
