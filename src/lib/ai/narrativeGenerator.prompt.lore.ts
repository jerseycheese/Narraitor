import { useAiContextStore } from '@/state/aiContextStore';
import type { EntityID } from '@/types/common.types';
import { safeTrim } from '@/lib/utils';
import { getLoreContextForPrompt } from './loreContextHelper';
import type { RequestBudget } from '@/lib/promptContext/tokenBudgetManager';
import { applyBudget } from './narrativeGenerator.budget';

export const enhancePromptWithLore = (
  prompt: string,
  worldId: EntityID,
  sessionId?: EntityID,
  budget?: RequestBudget
): string => {
  const loreContext = getLoreContextForPrompt(worldId, sessionId, {
    recordUsage: true,
    source: 'narrative',
  });
  return prompt + applyBudget(loreContext, 'lore-context', budget);
};

export const enhancePromptWithGoalContext = async (
  prompt: string,
  sessionId?: string,
  budget?: RequestBudget
): Promise<string> => {
  if (!sessionId) return prompt;

  try {
    const aiContext = await useAiContextStore
      .getState()
      .buildContextForSession(sessionId);

    if (aiContext.goalContext && safeTrim(aiContext.goalContext)) {
      const goalSection = `\n\nCURRENT NARRATIVE GOALS:\n${aiContext.goalContext}\n\nPlease consider these goals when generating the narrative content.`;

      if (!budget || !budget.isEnabled()) {
        return `${prompt}${goalSection}`;
      }

      const limited = applyBudget(goalSection, 'goals', budget);
      return safeTrim(limited) ? `${prompt}${limited}` : prompt;
    }

    return prompt;
  } catch {
    return prompt;
  }
};
