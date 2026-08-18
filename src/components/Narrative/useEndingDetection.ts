// src/components/Narrative/useEndingDetection.ts
//
// Pure AI-based ending detection, kept separate so the controller can stay
// focused on orchestrating narrative generation. Sends
// recent narrative context to Gemini and asks whether the story has reached
// a natural conclusion. Only fires onEndingSuggested for medium/high
// confidence responses, and holds the offer back while the story's major
// events are still unsettled; silent on any AI/parse/network failure (no
// fallback).

import { useCallback, useEffect, useRef } from 'react';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { truncate } from '@/lib/utils';
import { safeParseNarrativeAnalysis } from '@/lib/ai/parseNarrativeResponse';
import { stripMarkdownFences } from '@/lib/ai/parseJSON';
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
// Outside of high-signal moments, only run the AI ending check every Nth
// segment instead of after every single one. Natural endings cluster around
// major events and critical outcomes, which always trigger a check below.
const ROUTINE_CHECK_INTERVAL = 3;
const ACCEPTED_CONFIDENCES = new Set(['high', 'medium']);
const ACCEPTED_ENDING_TYPES = new Set<EndingType>([
  'story-complete',
  'character-retirement',
  'session-limit',
]);
const MAX_OPEN_THREADS = 6;

/**
 * Major events are the story's only durable record that something significant
 * is in play, and they never reached this prompt before: the model saw prose
 * only. Listing them gives it something to weigh the current calm against,
 * which is the difference between a resolution and a lull.
 */
function collectOpenThreads(segments: NarrativeSegment[]): string[] {
  const threads: string[] = [];
  for (const segment of segments) {
    const event = segment.metadata?.majorEvent;
    if (event) threads.push(event);
  }
  return threads.slice(-MAX_OPEN_THREADS);
}

/**
 * The shared parser narrows to a fixed shape, so the threat census is read
 * straight off the payload here. Null means the model never answered, which
 * the caller treats as "the calm went unweighed" rather than "all clear".
 */
function readUnresolvedThreats(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(stripMarkdownFences(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    const value = (parsed as Record<string, unknown>).unresolvedThreats;
    if (!Array.isArray(value)) return null;
    return value.filter(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
    );
  } catch {
    return null;
  }
}

interface UseEndingDetectionOptions {
  sessionId: string;
  worldId: string;
  characterId?: string;
  segments: NarrativeSegment[];
  onEndingSuggested?: (reason: string, endingType: EndingType) => void;
}

/**
 * Decides whether to spend an AI call checking for an ending on this segment.
 * Always checks segments flagged as a major event (endings cluster there);
 * otherwise throttles to every Nth segment. Critical decision outcomes are
 * deliberately NOT treated as high-signal: under the rebalanced lethality a
 * critical failure is usually a survivable setback, not an ending, so running
 * the ending check on every critical outcome surfaced spurious "wrap it up"
 * prompts mid-story (issue #1426). Genuinely lethal moments still end the run
 * via the fatal-outcome tag, and climactic resolutions get majorEvent.
 */
function shouldRunEndingCheck(
  segment: NarrativeSegment,
  totalSegments: number
): boolean {
  if (segment.metadata?.majorEvent) return true;

  return (totalSegments - MIN_SEGMENTS_FOR_ANALYSIS) % ROUTINE_CHECK_INTERVAL === 0;
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

      if (!shouldRunEndingCheck(newSegment, allSegments.length)) return;

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

        const openThreads = collectOpenThreads(recentSegments);
        const openThreadsContext =
          openThreads.length > 0
            ? `Threads this story put in play (each one is unfinished business unless the recent narrative settled it on the page):\n${openThreads
                .map((thread) => `- ${thread}`)
                .join('\n')}\n\n`
            : '';

        const analysisPrompt = `You are a narrative expert analyzing a story in progress. Determine if this story has reached a natural conclusion point where the player would feel satisfied ending.

${fullStoryContext}${openThreadsContext}Recent narrative developments:
${narrativeContext}

Analyze this story for natural ending points. Consider:

STORY STRUCTURE:
- Has the central conflict been resolved or reached climax?
- Are character arcs showing completion or fulfillment?
- Is there a sense of narrative closure or resolution?
- Does the story feel like it has reached a satisfying conclusion?

OPEN THREATS:
- Is any danger, pursuer, or unanswered call still active and unaddressed?
- Reaching safety is not the same as resolving what made it unsafe. A locked
  door with the threat still outside is a pause, not an ending.

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
  "unresolvedThreats": ["each threat or open question still active, or [] if none remain"],
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
          // A story with threads in play only gets an offer once the model
          // accounts for them. No census means the calm went unweighed, and
          // suppressing is recoverable where a premature offer is not: the
          // check runs again on later segments.
          const unresolvedThreats = readUnresolvedThreats(response.content);
          if (
            openThreads.length > 0 &&
            (unresolvedThreats === null || unresolvedThreats.length > 0)
          ) {
            logger.debug('Holding the ending offer back, threads still open', {
              openThreads,
              unresolvedThreats,
            });
            return;
          }

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
