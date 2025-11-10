/**
 * ResponseParser
 *
 * Handles JSON extraction, metadata parsing, and content normalization
 * from AI responses
 */

import { safeTrim } from '@/lib/utils';
import { normalizeText, NORM_DESC } from '@/lib/utils/textNormalization';
import type { AcquiredItemMetadata, GeneratedCharacterMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';

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

export class ResponseParser {
  /**
   * Parse AI response into structured format
   */
  parse(rawResponse: string): ParsedResponse {
    let actualContent = rawResponse || '';
    let extractedMetadata: ParsedResponse['metadata'] = {};

    // Try to parse JSON response if present
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
        // Try regex extraction as fallback
        const regexParsed = this.parseWithRegex(actualContent);
        if (regexParsed) {
          actualContent = regexParsed.content || actualContent;
          extractedMetadata = { ...extractedMetadata, ...regexParsed.metadata };
        }
      }
    }

    // Normalize the content
    const normalizedContent = normalizeText(actualContent, NORM_DESC);

    // Clean up character tokens in content
    const cleanedContent = this.cleanCharacterTokens(
      normalizedContent,
      extractedMetadata.characters
    );

    return {
      content: cleanedContent,
      metadata: extractedMetadata,
    };
  }

  /**
   * Parse JSON from AI response
   */
  private parseJSON(content: string): ParsedResponse | null {
    let jsonStr = safeTrim(content);

    // Handle markdown code blocks
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/, '').replace(/\s*```/, '');
    }

    jsonStr = safeTrim(jsonStr);

    // Find JSON object boundaries
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    } else if (jsonStart !== -1) {
      // Handle incomplete JSON by extracting content field directly
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

    // Parse JSON
    const parsed = JSON.parse(jsonStr);

    return {
      content: parsed.content || '',
      metadata: {
        location: parsed?.metadata?.location,
        mood: this.validateMood(parsed?.metadata?.mood),
        tags: Array.isArray(parsed?.metadata?.tags) ? parsed?.metadata?.tags : [],
        characterIds: Array.isArray(parsed?.metadata?.characterIds)
          ? parsed?.metadata?.characterIds
          : [],
        speakerId: typeof parsed?.metadata?.speakerId === 'string'
          ? parsed?.metadata?.speakerId
          : undefined,
        itemsAcquired: this.parseItemsAcquired(parsed?.metadata?.itemsAcquired),
        characters: this.parseCharacters(parsed?.metadata?.characters),
      },
    };
  }

  /**
   * Parse with regex as fallback for malformed JSON
   */
  private parseWithRegex(content: string): ParsedResponse | null {
    const result: ParsedResponse = {
      content: content,
      metadata: {},
    };

    // Extract content field
    const contentMatch = content.match(/"content"\s*:\s*"(.+?)"\s*,\s*"/);
    if (contentMatch && contentMatch[1]) {
      result.content = contentMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
    }

    // Extract location
    const locationMatch = content.match(/"location"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (locationMatch && locationMatch[1]) {
      result.metadata.location = locationMatch[1].replace(/\\"/g, '"');
    }

    // Extract speakerId
    const speakerMatch = content.match(/"speakerId"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (speakerMatch && speakerMatch[1]) {
      result.metadata.speakerId = speakerMatch[1].replace(/\\"/g, '"');
    }

    // Extract mood
    const moodMatch = content.match(/"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (moodMatch && moodMatch[1]) {
      result.metadata.mood = this.validateMood(moodMatch[1]);
    }

    return result;
  }

  /**
   * Parse items acquired from metadata
   */
  private parseItemsAcquired(
    items: unknown
  ): AcquiredItemMetadata[] | undefined {
    if (!Array.isArray(items)) {
      return undefined;
    }

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

  /**
   * Parse characters from metadata
   */
  private parseCharacters(
    characters: unknown
  ): GeneratedCharacterMetadata[] | undefined {
    if (!Array.isArray(characters)) {
      return undefined;
    }

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
        if (!id || !name) {
          return null;
        }
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

  /**
   * Validate mood value
   */
  private validateMood(
    mood?: string
  ):
    | 'neutral'
    | 'tense'
    | 'mysterious'
    | 'relaxed'
    | 'action'
    | 'emotional'
    | undefined {
    const validMoods = [
      'neutral',
      'tense',
      'mysterious',
      'relaxed',
      'action',
      'emotional',
    ];
    return validMoods.includes(mood || '')
      ? (mood as 'neutral' | 'tense' | 'mysterious' | 'relaxed' | 'action' | 'emotional')
      : undefined;
  }

  /**
   * Clean character tokens from content
   */
  private cleanCharacterTokens(
    content: string,
    characters?: GeneratedCharacterMetadata[]
  ): string {
    if (!characters || characters.length === 0 || !content) {
      return content;
    }

    let cleanedContent = content;

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    characters.forEach((character) => {
      if (!character?.id) return;

      const tokenRegex = new RegExp(`\\[${escapeRegExp(character.id)}\\]`, 'g');
      const displayName = safeTrim(character.name) || character.id;
      const firstToken = displayName.split(/[\s,]+/)[0]?.toLowerCase();
      const canonicalDisplayName = displayName
        .replace(/["""'''`´]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const normalizedDisplayName = canonicalDisplayName
        .replace(/[^0-9a-z\s]/gi, '')
        .toLowerCase();

      cleanedContent = cleanedContent.replace(
        tokenRegex,
        (match, offset, fullString) => {
          const precedingRaw = fullString.slice(0, offset);
          const precedingTrimmed = precedingRaw.trimEnd();
          const after = fullString.slice(offset + match.length);
          const afterTrimmed = after.trimStart();

          if (normalizedDisplayName.length === 0) {
            return '';
          }

          const tailSlice = precedingTrimmed.slice(
            Math.max(0, precedingTrimmed.length - displayName.length - 3)
          );
          const normalizedTailCanonical = tailSlice
            .replace(/["""'''`´]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          const normalizedTail = normalizedTailCanonical
            .replace(/[^0-9a-z\s]/gi, '')
            .toLowerCase();

          const precedingLower = precedingTrimmed.toLowerCase();
          const canonicalLower = canonicalDisplayName.toLowerCase();
          if (
            precedingLower.endsWith(canonicalLower) ||
            precedingLower.endsWith(`${canonicalLower}'s`) ||
            precedingLower.endsWith(`${canonicalLower}'s`)
          ) {
            return '';
          }

          if (normalizedTail.endsWith(normalizedDisplayName)) {
            return '';
          }

          if (firstToken) {
            const precedingWordMatch = precedingTrimmed.match(
              /([A-Za-zÀ-ÖØ-öø-ÿ'']+)[,;:]?$/
            );
            const precedingWord = precedingWordMatch?.[1];

            if (precedingWord) {
              const normalizedPrecedingWord = precedingWord
                .replace(/['']s$/i, '')
                .replace(/[^0-9A-Za-z]/g, '')
                .toLowerCase();

              const normalizedFirstToken = firstToken.replace(/[^0-9A-Za-z]/g, '');

              if (
                normalizedPrecedingWord &&
                normalizedFirstToken &&
                normalizedPrecedingWord === normalizedFirstToken
              ) {
                return '';
              }
            }
          }

          return displayName;
        }
      );
    });

    // Final cleanup
    cleanedContent = cleanedContent
      .replace(/[ \t]+([,;:.!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s*\[[a-z0-9-]+\]/gi, '');

    return cleanedContent;
  }
}
