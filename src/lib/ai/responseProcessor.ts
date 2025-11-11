/**
 * Response Processor
 *
 * Handles AI response parsing, lore extraction, inventory updates,
 * and language complexity enforcement in one consolidated module.
 */

import { safeTrim } from '@/lib/utils';
import { normalizeText, NORM_DESC } from '@/lib/utils/textNormalization';
import { EntityID } from '@/types/common.types';
import { NarrativeGenerationResult } from '@/types/narrative.types';
import type { AcquiredItemMetadata, GeneratedCharacterMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';
import { getLoreContextForPrompt } from './loreContextHelper';
import { extractStructuredLore } from './structuredLoreExtractor';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import { AIClient } from './types';
import { evaluateLanguageComplexity, buildLanguageComplexityReminder } from '@/lib/utils/languageComplexity';
import { ToneSettings } from '@/types/tone-settings.types';
import { logger } from '@/lib/utils/logger';

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

export interface ParsedResponse {
  content: string;
  metadata: {
    location?: string;
    mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral';
    tags?: string[];
    characterIds?: string[];
    speakerId?: string;
    itemsAcquired?: AcquiredItemMetadata[];
    characters?: GeneratedCharacterMetadata[];
  };
}

export class ResponseProcessor {
  constructor(private geminiClient: AIClient) {}

  /**
   * Parse, normalize, and clean AI response
   */
  parse(rawResponse: string): ParsedResponse {
    let actualContent = rawResponse || '';
    let extractedMetadata: ParsedResponse['metadata'] = {};

    // Try to parse JSON response
    if (
      actualContent.includes('```json') ||
      actualContent.startsWith('{') ||
      actualContent.includes('"content":')
    ) {
      try {
        const parsed = this.parseJSON(actualContent);
        if (parsed) {
          actualContent = parsed.content || actualContent;
          extractedMetadata = parsed.metadata;
        }
      } catch {
        const regexParsed = this.parseWithRegex(actualContent);
        if (regexParsed) {
          actualContent = regexParsed.content || actualContent;
          extractedMetadata = { ...extractedMetadata, ...regexParsed.metadata };
        }
      }
    }

    const normalizedContent = normalizeText(actualContent, NORM_DESC);
    const cleanedContent = this.cleanCharacterTokens(normalizedContent, extractedMetadata.characters);

    return {
      content: cleanedContent,
      metadata: extractedMetadata,
    };
  }

  /**
   * Extract and update lore from narrative content
   */
  async updateLore(content: string, worldId: EntityID, sessionId?: EntityID): Promise<void> {
    if (!content) return;

    try {
      const existingLoreContext = getLoreContextForPrompt(worldId);
      const structuredLore = await extractStructuredLore(content, existingLoreContext);
      const { useLoreStore } = await import('@/state/loreStore');
      const { addStructuredLore } = useLoreStore.getState();
      addStructuredLore(structuredLore, worldId, sessionId);
    } catch {
      // Failed to extract lore - continue without it
    }
  }

  /**
   * Process acquired items from narrative metadata
   */
  async processItems(
    itemsAcquired: AcquiredItemMetadata[],
    characterId: EntityID,
    sessionId: EntityID
  ): Promise<void> {
    if (!itemsAcquired || itemsAcquired.length === 0 || !characterId || !sessionId) {
      return;
    }
    void processAcquiredItems(itemsAcquired, characterId, sessionId);
  }

  /**
   * Enforce language complexity requirements
   */
  async enforceLanguageComplexity(
    result: NarrativeGenerationResult,
    toneSettings: ToneSettings
  ): Promise<NarrativeGenerationResult> {
    const level = toneSettings.languageComplexity;
    if (!result.content) return result;

    const evaluation = evaluateLanguageComplexity(result.content, level);
    if (evaluation.passes) return result;

    // Rewrite for non-literary levels
    if (level !== 'literary') {
      const rewritten = await this.rewriteContent(result.content, level, toneSettings.customInstructions);
      if (rewritten) {
        const secondEval = evaluateLanguageComplexity(rewritten, level);
        if (secondEval.passes) {
          logger.info('Narrative rewritten for language complexity', { level, metrics: secondEval.metrics });
          return { ...result, content: rewritten };
        }
      }
    }

    // Add warning tags
    logger.warn('Generated narrative exceeds language complexity guidelines', {
      reasons: evaluation.reasons,
      metrics: evaluation.metrics,
      level,
    });

    const existingTags = Array.isArray(result.metadata.tags) ? new Set(result.metadata.tags) : new Set<string>();
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

  private async rewriteContent(
    content: string,
    level: ToneSettings['languageComplexity'],
    customInstructions?: string
  ): Promise<string | null> {
    try {
      const reminder = buildLanguageComplexityReminder(level);
      const ruleLines = REWRITE_RULES[level].map(r => `- ${r}`).join('\n');
      const prompt = `You are revising narrative content to match STRICT ${level.toUpperCase()} language requirements.

${reminder}
${customInstructions ? `\nCUSTOM WORLD INSTRUCTIONS:\n${customInstructions}\n` : ''}

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

  private parseJSON(content: string): ParsedResponse | null {
    let jsonStr = safeTrim(content);

    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/, '').replace(/\s*```/, '');
    }

    jsonStr = safeTrim(jsonStr);

    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    } else if (jsonStart !== -1) {
      const contentMatch = jsonStr.match(/"content"\s*:\s*"([\s\S]*?)(?:",|\s*$)/);
      if (contentMatch && contentMatch[1]) {
        return {
          content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          metadata: {},
        };
      }
      throw new Error('Incomplete JSON without extractable content');
    } else {
      throw new Error('No JSON structure found');
    }

    const parsed = JSON.parse(jsonStr);

    return {
      content: parsed.content || '',
      metadata: {
        location: parsed?.metadata?.location,
        mood: this.validateMood(parsed?.metadata?.mood),
        tags: Array.isArray(parsed?.metadata?.tags) ? parsed?.metadata?.tags : [],
        characterIds: Array.isArray(parsed?.metadata?.characterIds) ? parsed?.metadata?.characterIds : [],
        speakerId: typeof parsed?.metadata?.speakerId === 'string' ? parsed?.metadata?.speakerId : undefined,
        itemsAcquired: this.parseItemsAcquired(parsed?.metadata?.itemsAcquired),
        characters: this.parseCharacters(parsed?.metadata?.characters),
      },
    };
  }

  private parseWithRegex(content: string): ParsedResponse | null {
    const result: ParsedResponse = { content: content, metadata: {} };

    const contentMatch = content.match(/"content"\s*:\s*"(.+?)"\s*,\s*"/);
    if (contentMatch && contentMatch[1]) {
      result.content = contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }

    const locationMatch = content.match(/"location"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (locationMatch && locationMatch[1]) {
      result.metadata.location = locationMatch[1].replace(/\\"/g, '"');
    }

    const speakerMatch = content.match(/"speakerId"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (speakerMatch && speakerMatch[1]) {
      result.metadata.speakerId = speakerMatch[1].replace(/\\"/g, '"');
    }

    const moodMatch = content.match(/"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (moodMatch && moodMatch[1]) {
      result.metadata.mood = this.validateMood(moodMatch[1]);
    }

    return result;
  }

  private parseItemsAcquired(items: unknown): AcquiredItemMetadata[] | undefined {
    if (!Array.isArray(items)) return undefined;
    return items.map((item: unknown) => {
      const rawItem = item as {
        name: string;
        description?: string;
        quantity?: number;
        acquisitionMethod?: string;
      };
      return {
        name: rawItem.name,
        description: rawItem.description,
        quantity: rawItem.quantity,
        acquisitionMethod: rawItem.acquisitionMethod as InventoryAcquisitionMethod,
      };
    });
  }

  private parseCharacters(characters: unknown): GeneratedCharacterMetadata[] | undefined {
    if (!Array.isArray(characters)) return undefined;

    return characters
      .map((character: unknown) => {
        const raw = character as {
          id?: string;
          name?: string;
          description?: string;
          role?: string;
          avatarPrompt?: string;
          avatarUrl?: string;
        };
        const id = raw?.id ? safeTrim(String(raw.id)) : '';
        const name = raw?.name ? safeTrim(String(raw.name)) : '';
        if (!id || !name) return null;
        return {
          id,
          name,
          description: raw?.description ? safeTrim(String(raw.description)) : undefined,
          role: raw?.role ? safeTrim(String(raw.role)) : undefined,
          avatarPrompt: raw?.avatarPrompt ? safeTrim(String(raw.avatarPrompt)) : undefined,
          avatarUrl: raw?.avatarUrl ? safeTrim(String(raw.avatarUrl)) : undefined,
        } as GeneratedCharacterMetadata;
      })
      .filter((value): value is GeneratedCharacterMetadata => Boolean(value));
  }

  private validateMood(
    mood?: string
  ): 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional' | undefined {
    const validMoods = ['neutral', 'tense', 'mysterious', 'relaxed', 'action', 'emotional'];
    return validMoods.includes(mood || '')
      ? (mood as 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional')
      : undefined;
  }

  private cleanCharacterTokens(content: string, characters?: GeneratedCharacterMetadata[]): string {
    if (!characters || characters.length === 0 || !content) return content;

    let cleanedContent = content;
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    characters.forEach((character) => {
      if (!character?.id) return;

      const tokenRegex = new RegExp(`\\[${escapeRegExp(character.id)}\\]`, 'g');
      const displayName = safeTrim(character.name) || character.id;

      cleanedContent = cleanedContent.replace(tokenRegex, () => displayName);
    });

    cleanedContent = cleanedContent
      .replace(/[ \t]+([,;:.!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s*\[[a-z0-9-]+\]/gi, '');

    return cleanedContent;
  }
}
