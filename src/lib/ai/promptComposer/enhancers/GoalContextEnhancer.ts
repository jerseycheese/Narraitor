/**
 * GoalContextEnhancer
 *
 * Enhances prompts with goal context from the AI context store
 */

import { PromptEnhancer } from '../types';
import { NarrativeGenerationContext } from '../../narrativeGenerationContext';
import { safeTrim } from '@/lib/utils';

export class GoalContextEnhancer implements PromptEnhancer {
  readonly name = 'GoalContextEnhancer';

  enhance(prompt: string, context: NarrativeGenerationContext): string {
    if (!context.sessionId) {
      return prompt;
    }

    const goalContext = context.goalContext;

    if (goalContext && safeTrim(goalContext)) {
      return `${prompt}\n\nCURRENT NARRATIVE GOALS:\n${goalContext}\n\nPlease consider these goals when generating the narrative content.`;
    }

    return prompt;
  }
}
