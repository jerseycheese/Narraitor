/**
 * PromptComposer
 *
 * Composes prompts by applying an ordered list of enhancers.
 * Replaces ad-hoc enhancer chains with declarative composition.
 */

import { NarrativeGenerationContext } from '../narrativeGenerationContext';
import { PromptEnhancer, PromptCompositionOptions } from './types';
import { logger } from '@/lib/utils/logger';

export class PromptComposer {
  /**
   * Compose a prompt by applying enhancers in order
   */
  async compose(
    basePrompt: string,
    context: NarrativeGenerationContext,
    options: PromptCompositionOptions
  ): Promise<string> {
    let enhancedPrompt = basePrompt;

    for (const enhancer of options.enhancers) {
      try {
        const result = await enhancer.enhance(enhancedPrompt, context);
        enhancedPrompt = result;
      } catch (error) {
        const enhancerName = enhancer.name || 'UnnamedEnhancer';
        logger.warn(`Enhancer ${enhancerName} failed`, { error });

        if (!options.skipFailedEnhancers) {
          throw new Error(`Enhancer ${enhancerName} failed: ${error}`);
        }
      }
    }

    return enhancedPrompt;
  }
}
