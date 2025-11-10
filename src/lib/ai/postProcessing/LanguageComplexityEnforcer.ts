/**
 * LanguageComplexityEnforcer
 *
 * Evaluates and enforces language complexity requirements
 * Rewrites content that violates complexity thresholds
 */

import { ToneSettings } from '@/types/tone-settings.types';
import { AIClient } from '../types';
import { evaluateLanguageComplexity, buildLanguageComplexityReminder } from '@/lib/utils/languageComplexity';
import { logger } from '@/lib/utils/logger';
import { NarrativeGenerationResult } from '@/types/narrative.types';

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

export class LanguageComplexityEnforcer {
  constructor(private geminiClient: AIClient) {}

  /**
   * Enforce language complexity requirements on generated content
   */
  async enforce(
    result: NarrativeGenerationResult,
    toneSettings: ToneSettings
  ): Promise<NarrativeGenerationResult> {
    const level = toneSettings.languageComplexity;

    if (!result.content) {
      return result;
    }

    const evaluation = evaluateLanguageComplexity(result.content, level);

    if (evaluation.passes) {
      return result;
    }

    // Literary level doesn't get rewritten
    if (level !== 'literary') {
      const rewritten = await this.rewriteContent(
        result.content,
        level,
        toneSettings.customInstructions
      );

      if (rewritten) {
        const secondEval = evaluateLanguageComplexity(rewritten, level);
        if (secondEval.passes) {
          logger.info('Narrative rewritten to align with language complexity guidelines.', {
            level,
            metrics: secondEval.metrics,
          });

          return {
            ...result,
            content: rewritten,
          };
        }

        logger.warn('Language complexity rewrite did not pass thresholds', {
          level,
          reasons: secondEval.reasons,
          metrics: secondEval.metrics,
        });
      }
    }

    // Add warning tags if complexity check failed
    logger.warn('Generated narrative exceeds language complexity guidelines', {
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
  }

  /**
   * Rewrite content to match complexity level
   */
  private async rewriteContent(
    content: string,
    level: ToneSettings['languageComplexity'],
    customInstructions?: string
  ): Promise<string | null> {
    try {
      const reminder = buildLanguageComplexityReminder(level);
      const ruleLines = REWRITE_RULES[level]
        .map((rule) => `- ${rule}`)
        .join('\n');
      const prompt = `You are revising narrative content to match STRICT ${level.toUpperCase()} language requirements.

${reminder}
${customInstructions ? `
CUSTOM WORLD INSTRUCTIONS:
${customInstructions}
` : ''}

REVISION RULES:
${ruleLines}

Original narrative:
<<<
${content}
>>>

Return ONLY the rewritten narrative.`;

      const response = await this.geminiClient.generateContent(prompt);
      const rewritten = response.content?.trim();
      return rewritten && rewritten.length > 0 ? rewritten : null;
    } catch (error) {
      logger.warn('Failed to rewrite narrative for language complexity', { level, error });
      return null;
    }
  }
}
