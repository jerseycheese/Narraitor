// Fixtures for ending detection tests
import type { NarrativeSegment } from '@/types/narrative.types';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

export const createMockCheckForEndingIndicators = () => {
  return async (
    segments: NarrativeSegment[],
    newSegment: NarrativeSegment,
    onEndingSuggested: (reason: string, endingType: string) => void
  ) => {
    const allSegments = [...segments, newSegment];
    if (allSegments.length < 3) return;

    try {
      const client = createDefaultGeminiClient();
      const recentSegments = allSegments.slice(-5);
      const narrativeContext = recentSegments
        .map((segment, index) => `Segment ${index + 1}: ${segment.content}`)
        .join('\n\n');

      const fullStoryContext =
        allSegments.length > 10
          ? `Earlier story: ${allSegments
              .slice(0, -5)
              .map((s) => s.content)
              .join(' ')
              .substring(0, 500)}...\n\n`
          : '';

      const analysisPrompt = `You are a narrative expert analyzing a story in progress. Determine if this story has reached a natural conclusion point where the player would feel satisfied ending.

${fullStoryContext}Recent narrative developments:
${narrativeContext}

Analyze this story for natural ending points. Consider: STORY STRUCTURE: - Has the central conflict been resolved or reached climax? - Are character arcs showing completion or fulfillment? - Is there a sense of narrative closure or resolution? - Does the story feel like it has reached a satisfying conclusion? EMOTIONAL SATISFACTION: - Would ending here feel fulfilling to the reader? - Are loose threads tied up or at a natural pause? - Is there dramatic or emotional resolution? DO NOT: - Look for specific keywords or phrases - Use pattern matching - Apply rigid rules - Suggest ending just because of story length Respond with JSON format: { "suggestEnding": true/false, "confidence": "high" | "medium" | "low", "endingType": "story-complete" | "character-retirement" | "session-limit" | "none", "reason": "Clear explanation of why this is/isn't a good ending point" }`;

      const response = await client.generateContent(analysisPrompt);

      try {
        const analysis = JSON.parse(response.content);
        if (analysis.suggestEnding && ['high', 'medium'].includes(analysis.confidence)) {
          const endingType = ['story-complete', 'character-retirement', 'session-limit'].includes(
            analysis.endingType
          )
            ? analysis.endingType
            : 'story-complete';
          onEndingSuggested(analysis.reason, endingType);
        }
      } catch (parseError) {
        console.error('Failed to parse AI ending analysis:', parseError);
      }
    } catch (error) {
      console.error('Failed to analyze ending indicators with AI:', error);
    }
  };
};

type AIAnalysisOverrides = {
  suggestEnding?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  endingType?: 'story-complete' | 'character-retirement' | 'session-limit' | 'none';
  reason?: string;
};

export const createMockAIResponse = (overrides?: AIAnalysisOverrides) => ({
  content: JSON.stringify({
    suggestEnding: true,
    confidence: 'high',
    endingType: 'story-complete',
    reason: 'Default reason',
    ...overrides
  })
});
