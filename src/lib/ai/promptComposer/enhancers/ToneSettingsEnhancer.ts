/**
 * ToneSettingsEnhancer
 *
 * Enhances prompts with detailed tone settings for consistent narrative style
 */

import { PromptEnhancer } from '../types';
import { NarrativeGenerationContext } from '../../narrativeGenerationContext';
import { getDetailedToneInstructions } from '../../toneSettingsGuidance';
import { ToneSettings } from '@/types/tone-settings.types';

const COMPLEXITY_ALERTS: Record<ToneSettings['languageComplexity'], string> = {
  simple: `

SIMPLE LANGUAGE ALERT:
- Keep every sentence under ~12 words.
- Use everyday vocabulary (grade-school level).
- Prefer plain, direct statements over figurative language.
- Violations will be rewritten automatically, so comply on the first pass.`,
  moderate: `

MODERATE LANGUAGE REMINDER:
- Balance concise narration with occasional descriptive flourishes.
- Target an average of 12-18 words per sentence.
- Introduce advanced terms sparingly and clarify them in context.`,
  advanced: `

ADVANCED LANGUAGE REMINDER:
- Maintain rich vocabulary and layered imagery without sacrificing clarity.
- Aim for varied sentence structures with an average under ~25 words.
- Avoid multi-clause run-ons that become difficult to parse.`,
  literary: '',
};

export class ToneSettingsEnhancer implements PromptEnhancer {
  readonly name = 'ToneSettingsEnhancer';

  enhance(prompt: string, context: NarrativeGenerationContext): string {
    const toneSettings = context.toneSettings;

    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    const complexityAlert = COMPLEXITY_ALERTS[toneSettings.languageComplexity] ?? '';

    return prompt + detailedInstructions + complexityAlert;
  }
}
