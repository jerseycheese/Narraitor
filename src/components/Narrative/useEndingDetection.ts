// src/components/Narrative/useEndingDetection.ts
//
// Pure AI-based ending detection extracted from NarrativeController so the
// controller can stay focused on orchestrating narrative generation. Sends
// recent narrative context to Gemini and asks whether the story has reached
// a natural conclusion. Only fires onEndingSuggested for medium/high
// confidence responses; silent on any AI/parse/network failure (no fallback).

import { useCallback, useEffect, useRef } from 'react';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { truncate } from '@/lib/utils';
import { safeParseNarrativeAnalysis } from '@/lib/ai/parseNarrativeResponse';
import type {
  EndingType,
  NarrativeSegment,
} from '@/types/narrative.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('UseEndingDetection');

const MIN_SEGMENTS_FOR_ANALYSIS = 3;
const RECENT_SEGMENT_WINDOW = 5;
const LONG_STORY_THRESHOLD = 10;
const EARLIER_CONTEXT_TRUNCATE_CHARS = 500;
const ACCEPTED_CONFIDENCES = new Set(['high', 'medium']);
const ACCEPTED_ENDING_TYPES = new Set<EndingType>([
  'story-complete',
  'character-retirement',
  'session-limit',
]);

interface UseEndingDetectionOptions {
  sessionId: string;
  worldId: string;
  characterId?: string;
  segments: NarrativeSegment[];
  onEndingSuggested?: (reason: string, endingType: EndingType) => void;
}

export function useEndingDetection({
  sessionId,
  worldId,
  characterId,
  segments,
  onEndingSuggested,
}: UseEndingDetectionOptions) {
  // Once we suggest an ending for a given session, don't suggest again until
  // the session/world/character key changes — matches the original reset
  // cadence in NarrativeController's mount effect.
  const endingSuggestedRef = useRef(false);

  useEffect(() => {
    endingSuggestedRef.current = false;
  }, [sessionId, worldId, characterId]);

  /**
   * Fire onEndingSuggested at most once per session/world/character key. Used
   * by callers (e.g. critical-failure and fatal-tag branches) that need to
   * short-circuit the AI check and surface an ending immediately.
   */
  const suggestEnding = useCallback(
    (reason: string, endingType: EndingType) => {
      if (endingSuggestedRef.current || !onEndingSuggested) return;
      endingSuggestedRef.current = true;
      onEndingSuggested(reason, endingType);
    },
    [onEndingSuggested]
  );

  const checkForEndingIndicators = useCallback(
    async (newSegment: NarrativeSegment) => {
      if (endingSuggestedRef.current || !onEndingSuggested) return;

      const allSegments = [...segments, newSegment];
      if (allSegments.length < MIN_SEGMENTS_FOR_ANALYSIS) return;

      try {
        const client = createDefaultGeminiClient();

        const recentSegments = allSegments.slice(-RECENT_SEGMENT_WINDOW);
        const narrativeContext = recentSegments
          .map((segment, index) => `Segment ${index + 1}: ${segment.content}`)
          .join('\n\n');

        const fullStoryContext =
          allSegments.length > LONG_STORY_THRESHOLD
            ? `Earlier story: ${truncate(
                allSegments
                  .slice(0, -RECENT_SEGMENT_WINDOW)
                  .map((s) => s.content)
                  .join(' '),
                EARLIER_CONTEXT_TRUNCATE_CHARS
              )}\n\n`
            : '';

        const analysisPrompt = `You are a narrative expert analyzing a story in progress. Determine if this story has reached a natural conclusion point where the player would feel satisfied ending.

${fullStoryContext}Recent narrative developments:
${narrativeContext}

Analyze this story for natural ending points. Consider:

STORY STRUCTURE:
- Has the central conflict been resolved or reached climax?
- Are character arcs showing completion or fulfillment?
- Is there a sense of narrative closure or resolution?
- Does the story feel like it has reached a satisfying conclusion?

EMOTIONAL SATISFACTION:
- Would ending here feel fulfilling to the reader?
- Are loose threads tied up or at a natural pause?
- Is there dramatic or emotional resolution?

DO NOT:
- Look for specific keywords or phrases
- Use pattern matching
- Apply rigid rules
- Suggest ending just because of story length

Respond with JSON format:
{
  "suggestEnding": true/false,
  "confidence": "high" | "medium" | "low",
  "endingType": "story-complete" | "character-retirement" | "session-limit" | "none",
  "reason": "Short user-facing message (1-2 sentences max) about why this is a good ending point. Be concise and direct."
}`;

        const response = await client.generateContent(analysisPrompt);

        const analysis = safeParseNarrativeAnalysis(response.content);

        if (
          analysis &&
          analysis.suggestEnding &&
          ACCEPTED_CONFIDENCES.has(analysis.confidence)
        ) {
          const endingType: EndingType = ACCEPTED_ENDING_TYPES.has(analysis.endingType)
            ? analysis.endingType
            : 'story-complete';

          endingSuggestedRef.current = true;
          onEndingSuggested(analysis.reason, endingType);
        }
      } catch (error) {
        logger.error('Failed to analyze ending indicators with AI:', error);
      }
    },
    [segments, onEndingSuggested]
  );

  return { checkForEndingIndicators, suggestEnding };
}
