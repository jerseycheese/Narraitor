import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import type { World } from '@/types/world.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { getComplexityAlert } from './narrativeGenerator.languageComplexity';
import type { RequestBudget } from '@/lib/promptContext/tokenBudgetManager';
import { applyBudget } from './narrativeGenerator.budget';
import type { NarrativeStaticContentCache } from './narrativeGenerator.prompt.types';

export const enhancePromptWithToneSettings = (
  prompt: string,
  world: World,
  cache: NarrativeStaticContentCache,
  budget?: RequestBudget
): string => {
  const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
  const cacheKey = `${world.id}-${toneSettings.contentRating}-${toneSettings.narrativeStyle}-${toneSettings.languageComplexity}`;

  if (!cache.toneSettings) {
    cache.toneSettings = new Map();
  }

  let toneInstructions = cache.toneSettings.get(cacheKey);

  if (!toneInstructions) {
    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    const complexityAlert = getComplexityAlert(toneSettings.languageComplexity);

    toneInstructions = detailedInstructions + complexityAlert;
    cache.toneSettings.set(cacheKey, toneInstructions);
  }

  if (!budget || !budget.isEnabled()) {
    return prompt + toneInstructions;
  }

  return prompt + applyBudget(toneInstructions, 'tone-settings', budget);
};
