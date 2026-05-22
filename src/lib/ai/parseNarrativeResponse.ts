import type { EndingType } from '@/types/narrative.types';
import { stripMarkdownFences } from './parseJSON';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ParseNarrativeResponse');

export interface NarrativeEndingAnalysis {
  suggestEnding: boolean;
  confidence: 'high' | 'medium' | 'low';
  endingType: EndingType;
  reason: string;
}

const VALID_CONFIDENCES = new Set(['high', 'medium', 'low']);
const VALID_ENDING_TYPES = new Set<EndingType>([
  'story-complete',
  'character-retirement',
  'session-limit',
  'player-choice',
]);

/**
 * Parses an AI ending-analysis response, tolerating markdown code fences and
 * unexpected shapes. Returns null when the payload is unparseable or doesn't
 * match the expected schema; callers should treat null as "no suggestion."
 */
export function safeParseNarrativeAnalysis(
  raw: string
): NarrativeEndingAnalysis | null {
  const cleaned = stripMarkdownFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    logger.error('safeParseNarrativeAnalysis: invalid JSON', error);
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.suggestEnding !== 'boolean') return null;
  if (typeof obj.confidence !== 'string' || !VALID_CONFIDENCES.has(obj.confidence)) {
    return null;
  }
  if (typeof obj.reason !== 'string') return null;

  const endingType: EndingType = VALID_ENDING_TYPES.has(obj.endingType as EndingType)
    ? (obj.endingType as EndingType)
    : 'story-complete';

  return {
    suggestEnding: obj.suggestEnding,
    confidence: obj.confidence as NarrativeEndingAnalysis['confidence'],
    endingType,
    reason: obj.reason,
  };
}
