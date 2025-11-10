/**
 * LoreEnhancer
 *
 * Enhances prompts with lore context for the given world
 */

import { PromptEnhancer } from '../types';
import { NarrativeGenerationContext } from '../../narrativeGenerationContext';

export class LoreEnhancer implements PromptEnhancer {
  readonly name = 'LoreEnhancer';

  enhance(prompt: string, context: NarrativeGenerationContext): string {
    const loreContext = context.loreContext || '';
    return prompt + loreContext;
  }
}
