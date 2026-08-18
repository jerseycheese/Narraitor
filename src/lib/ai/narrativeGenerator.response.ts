import type { NarrativeGenerationResult } from '@/types/narrative.types';
import type { AIClient } from './types';
import { analyzeSegmentMetadata } from './narrativeGenerator.metadata';
import { parseNarrativeResponse } from './narrativeGenerator.response.parse';
import { normalizeNarrativeContent } from './narrativeGenerator.response.normalize';
import {
  normalizeId,
  normalizeCharacterIds,
  getWorldGenre,
  getMoodForGenre,
  FIRST_SEGMENT_LOCATION,
} from './narrativeGenerator.response.helpers';
import { safeTrim } from '@/lib/utils';

export const formatNarrativeResponse = async (
  response: { content?: string; tokenUsage?: number },
  segmentType: string,
  geminiClient: AIClient,
  previousLocation?: string
): Promise<NarrativeGenerationResult> => {
  const parsed = parseNarrativeResponse(response, segmentType);
  const actualContent = parsed.actualContent;
  const extractedMetadata = parsed.extractedMetadata;
  const resolvedSegmentType = parsed.segmentType;

  const fallbackMood = getMoodForGenre(getWorldGenre());
  const fallbackLocation = previousLocation || FIRST_SEGMENT_LOCATION;

  const normalizedContent = normalizeNarrativeContent(
    actualContent,
    extractedMetadata
  );

  const speakerId = normalizeId(extractedMetadata.speakerId);
  const characterIds = normalizeCharacterIds(extractedMetadata.characterIds);
  const finalCharacterIds =
    speakerId && !characterIds.includes(speakerId)
      ? [...characterIds, speakerId]
      : characterIds;

  const metadataAnalysis = await analyzeSegmentMetadata(
    normalizedContent,
    extractedMetadata.characters,
    finalCharacterIds,
    geminiClient
  );
  const confirmedCharacterIds =
    metadataAnalysis.presentCharacterIds.length > 0
      ? metadataAnalysis.presentCharacterIds
      : finalCharacterIds;
  const analyzedItems =
    extractedMetadata.itemsAcquired && extractedMetadata.itemsAcquired.length > 0
      ? extractedMetadata.itemsAcquired
      : metadataAnalysis.items;
  const sanitizedMajorEvent =
    extractedMetadata.majorEvent && safeTrim(extractedMetadata.majorEvent).length > 0
      ? safeTrim(extractedMetadata.majorEvent)
      : undefined;

  return {
    content: normalizedContent,
    segmentType: resolvedSegmentType as
      | 'scene'
      | 'dialogue'
      | 'action'
      | 'transition',
    metadata: {
      characterIds: confirmedCharacterIds,
      speakerId,
      location: extractedMetadata.location || fallbackLocation,
      mood: extractedMetadata.mood || fallbackMood,
      tags: extractedMetadata.tags || [getWorldGenre() || 'fantasy', 'narrative'],
      itemsAcquired:
        analyzedItems && analyzedItems.length > 0 ? analyzedItems : undefined,
      itemsLost:
        extractedMetadata.itemsLost && extractedMetadata.itemsLost.length > 0
          ? extractedMetadata.itemsLost
          : undefined,
      characters: extractedMetadata.characters,
      majorEvent: sanitizedMajorEvent,
    },
    tokenUsage:
      response.tokenUsage && typeof response.tokenUsage === 'object'
        ? response.tokenUsage
        : response.tokenUsage
          ? {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: response.tokenUsage as number,
            }
          : undefined,
  };
};
