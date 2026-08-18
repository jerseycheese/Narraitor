import { safeTrim } from '@/lib/utils';
import { isValidCategory } from '@/lib/inventory/categories';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';
import type { GeneratedCharacterMetadata, LostItemMetadata } from '@/types/narrative.types';
import type { ParsedNarrativeResponse, NarrativeExtractedMetadata } from './narrativeGenerator.response.types';
import { validateMood, validateLossReason } from './narrativeGenerator.response.helpers';
import { stripMarkdownFences, extractJsonObject } from './parseJSON';

/**
 * A recovered passage is at minimum a full sentence, so anything shorter is a
 * fragment the response was cut off mid-way through rather than prose.
 */
const MIN_RECOVERED_PASSAGE_LENGTH = 20;

/**
 * Recognises what's left when a response never carried a usable content field -
 * a bare brace, an unclosed object, a fragment cut off mid-sentence. Only
 * applied to text the recovery paths produced; a content field the model
 * actually closed is taken at its word however short it is.
 */
const isJsonDebris = (text: string): boolean => {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    !/\w/.test(trimmed) ||
    trimmed.length < MIN_RECOVERED_PASSAGE_LENGTH
  );
};

export const parseNarrativeResponse = (
  response: { content?: string },
  segmentType: string
): ParsedNarrativeResponse => {
  let actualContent = response.content || '';
  let extractedMetadata: NarrativeExtractedMetadata = {};
  let contentFromParsedField = false;

  if (
    actualContent.includes('```json') ||
    actualContent.startsWith('{') ||
    actualContent.includes('"content":')
  ) {
    try {
      const stripped = stripMarkdownFences(actualContent);
      const jsonStr = extractJsonObject(stripped);

      if (jsonStr === null) {
        // No complete object. If an opening brace is present the response was
        // truncated mid-object: recover the content field. Otherwise there's
        // no JSON at all.
        if (stripped.indexOf('{') !== -1) {
          const contentMatch = stripped.match(
            /"content"\s*:\s*"([\s\S]*?)(?:",|\s*$)/
          );
          if (contentMatch && contentMatch[1]) {
            actualContent = contentMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n');
          } else {
            throw new Error('Incomplete JSON without extractable content');
          }
        } else {
          throw new Error('No JSON structure found');
        }
      } else {
        const parsed = JSON.parse(jsonStr);
        if (parsed.content) {
          actualContent = parsed.content;
          contentFromParsedField = true;
        }
        if (
          parsed.type &&
          ['scene', 'dialogue', 'action', 'transition', 'ending'].includes(
            parsed.type
          )
        ) {
          segmentType = parsed.type;
        }
        if (parsed.metadata) {
          extractedMetadata = {
            location: parsed?.metadata?.location,
            mood: validateMood(parsed?.metadata?.mood),
            tags: Array.isArray(parsed?.metadata?.tags)
              ? parsed?.metadata?.tags
              : [],
            characterIds: Array.isArray(parsed?.metadata?.characterIds)
              ? parsed?.metadata?.characterIds
              : [],
            speakerId:
              typeof parsed?.metadata?.speakerId === 'string'
                ? parsed?.metadata?.speakerId
                : undefined,
            itemsAcquired: Array.isArray(parsed?.metadata?.itemsAcquired)
              ? parsed?.metadata?.itemsAcquired.map((item: unknown) => {
                  const rawItem = item as {
                    name: string;
                    description?: string;
                    quantity?: number;
                    acquisitionMethod?: string;
                    categoryHint?: string;
                  };
                  return {
                    name: rawItem.name,
                    description: rawItem.description,
                    quantity: rawItem.quantity,
                    acquisitionMethod:
                      rawItem.acquisitionMethod as InventoryAcquisitionMethod,
                    categoryHint:
                      typeof rawItem.categoryHint === 'string' &&
                      isValidCategory(rawItem.categoryHint)
                        ? rawItem.categoryHint
                        : undefined,
                  };
                })
              : undefined,
            itemsLost: Array.isArray(parsed?.metadata?.itemsLost || parsed?.itemsLost)
              ? (parsed?.metadata?.itemsLost || parsed?.itemsLost)
                  .map((item: unknown) => {
                    const rawItem = item as {
                      name: string;
                      itemId?: string;
                      quantity?: number;
                      lossReason?: string;
                      lossContext?: string;
                    };
                    return {
                      name: rawItem.name,
                      itemId: rawItem.itemId,
                      quantity: rawItem.quantity,
                      lossReason: validateLossReason(rawItem.lossReason),
                      lossContext: rawItem.lossContext,
                    } as LostItemMetadata;
                  })
                  .filter((item: LostItemMetadata) => Boolean(item.name))
              : undefined,
            characters: Array.isArray(parsed?.metadata?.characters)
              ? parsed.metadata.characters
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
                      description: raw?.description
                        ? safeTrim(String(raw.description))
                        : undefined,
                      role: raw?.role
                        ? safeTrim(String(raw.role))
                        : undefined,
                      avatarPrompt: raw?.avatarPrompt
                        ? safeTrim(String(raw.avatarPrompt))
                        : undefined,
                      avatarUrl: raw?.avatarUrl
                        ? safeTrim(String(raw.avatarUrl))
                        : undefined,
                    } as GeneratedCharacterMetadata;
                  })
                  .filter(
                    (
                      value: GeneratedCharacterMetadata | null | undefined
                    ): value is GeneratedCharacterMetadata => Boolean(value)
                  )
              : undefined,
            majorEvent:
              typeof parsed?.metadata?.majorEvent === 'string'
                ? safeTrim(String(parsed.metadata.majorEvent)).slice(0, 180)
                : undefined,
          };
        }
      }
    } catch {
      try {
        const contentStartMatch = actualContent.match(
          /"content"\s*:\s*"(.+?)"\s*,\s*"/
        );
        if (contentStartMatch && contentStartMatch[1]) {
          actualContent = contentStartMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
        } else {
          const altContentMatch = actualContent.match(
            /"content"\s*:\s*"([^"]*(?:"[^"]*"[^"]*)*)"/
          );
          if (altContentMatch && altContentMatch[1]) {
            actualContent = altContentMatch[1];
          } else {
            const finalContentMatch = actualContent.match(
              /"content"\s*:\s*"(.+?)"\s*,\s*"(?:type|metadata)/
            );
            if (finalContentMatch && finalContentMatch[1]) {
              actualContent = finalContentMatch[1];
            }
          }
        }

        const locationMatch = actualContent.match(
          /"location"\s*:\s*"((?:[^"\\]|\\.)*)"/
        );
        if (locationMatch && locationMatch[1]) {
          extractedMetadata.location = locationMatch[1].replace(/\\"/g, '"');
        }

        const speakerMatch = actualContent.match(
          /"speakerId"\s*:\s*"((?:[^"\\]|\\.)*)"/
        );
        if (speakerMatch && speakerMatch[1]) {
          extractedMetadata.speakerId = speakerMatch[1].replace(/\\"/g, '"');
        }

        const moodMatch = actualContent.match(
          /"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/
        );
        if (moodMatch && moodMatch[1]) {
          extractedMetadata.mood = validateMood(moodMatch[1]);
        }
      } catch {
        // Fallback extraction failed - use default content
      }
    }

    // Every recovery path above can leave the raw text in place. Failing here
    // hands the turn to the existing retry and fallback-segment handling
    // instead of shipping a one-character passage.
    if (!contentFromParsedField && isJsonDebris(actualContent)) {
      throw new Error('Service error: malformed API response');
    }
  }

  return {
    actualContent,
    extractedMetadata,
    segmentType,
  };
};
