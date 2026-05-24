import type { NarrativeGenerationResult } from '@/types/narrative.types';
import type { ToneSettings } from '@/types/tone-settings.types';
import type { AIClient } from './types';
import {
  evaluateLanguageComplexity,
  buildLanguageComplexityReminder,
} from '@/lib/utils/languageComplexity';
import { logger } from '@/lib/utils/logger';

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

const REWRITE_RULES: Record<ToneSettings['languageComplexity'], string[]> = {
  simple: [
    'Keep sentences short (target 10-12 words).',
    'Use everyday vocabulary; avoid figurative language unless universally familiar.',
    'Maintain existing markdown emphasis exactly as provided.',
    'Preserve every story beat, character emotion, and outcome.',
  ],
  moderate: [
    'Target 12-18 words per sentence with a mix of simple and compound structures.',
    'Use mostly familiar vocabulary; explain any advanced term within the sentence.',
    'Maintain markdown formatting and existing narrative content.',
  ],
  advanced: [
    'Allow nuanced vocabulary and complex sentences, but keep the average under ~25 words.',
    'Alternate longer sentences with shorter lines to preserve readability.',
    'Maintain markdown formatting and all narrative details.',
  ],
  literary: [
    'Elevate language with sophisticated imagery while keeping the prose comprehensible.',
    'Vary pacing with intentional sentence length changes to maintain rhythm.',
    'Maintain markdown formatting and all narrative details.',
  ],
};

export const getComplexityAlert = (
  level: ToneSettings['languageComplexity']
): string => COMPLEXITY_ALERTS[level] ?? '';

export const enforceLanguageComplexity = async (
  result: NarrativeGenerationResult,
  toneSettings: ToneSettings,
  geminiClient: AIClient
): Promise<NarrativeGenerationResult> => {
  const level = toneSettings.languageComplexity;

  if (!result.content) {
    return result;
  }

  const evaluation = evaluateLanguageComplexity(result.content, level);

  if (evaluation.passes) {
    return result;
  }

  if (level !== 'literary') {
    const rewritten = await rewriteContentForComplexity(
      result.content,
      level,
      toneSettings.customInstructions,
      geminiClient
    );

    if (rewritten) {
      const secondEval = evaluateLanguageComplexity(rewritten, level);
      if (secondEval.passes) {
        return {
          ...result,
          content: rewritten,
        };
      }

      logger.debug('Language complexity rewrite did not pass thresholds', {
        level,
        reasons: secondEval.reasons,
        metrics: secondEval.metrics,
      });
    }
  }

  logger.debug('Generated narrative exceeds language complexity guidelines', {
    reasons: evaluation.reasons,
    metrics: evaluation.metrics,
    level,
  });

  const existingTags = Array.isArray(result.metadata.tags)
    ? new Set(result.metadata.tags)
    : new Set<string>();
  existingTags.add('language-complexity-review');
  existingTags.add(`language-complexity-${level}`);

  return {
    ...result,
    metadata: {
      ...result.metadata,
      tags: Array.from(existingTags),
    },
  };
};

const rewriteContentForComplexity = async (
  content: string,
  level: ToneSettings['languageComplexity'],
  customInstructions: string | undefined,
  geminiClient: AIClient
): Promise<string | null> => {
  try {
    const reminder = buildLanguageComplexityReminder(level);
    const ruleLines = REWRITE_RULES[level]
      .map((rule) => `- ${rule}`)
      .join('\n');
    const prompt = `You are revising narrative content to match STRICT ${level.toUpperCase()} language requirements.

${reminder}
${
  customInstructions
    ? `
CUSTOM WORLD INSTRUCTIONS:
${customInstructions}
`
    : ''
}

REVISION RULES:
${ruleLines}

Original narrative:
<<<
${content}
>>>

Return ONLY the rewritten narrative.`;

    const response = await geminiClient.generateContent(prompt);
    let rewritten = response.content?.trim();

    if (rewritten) {
      rewritten = rewritten.replace(/^<<<\s*/, '').replace(/\s*>>>$/, '');
    }

    return rewritten && rewritten.length > 0 ? rewritten : null;
  } catch (error) {
    logger.warn('Failed to rewrite narrative for language complexity', {
      level,
      error,
    });
    return null;
  }
};
