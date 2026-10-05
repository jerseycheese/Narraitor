import { createDefaultGeminiClient } from './defaultGeminiClient';
import { getAIConfig } from './config';
import { StoryCheckpointRequestBody, StoryCheckpointResponseBody } from '@/types/story-checkpoint.types';
import { getNarrativeTemplate } from '@/lib/promptTemplates/narrativeTemplateManager';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { formatChapterRecap, fallbackChapterRecap } from '@/lib/narrative/chapters';
import { safeTrim } from '@/lib/utils';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { stripMarkdownFences, extractJsonObject } from './parseJSON';
import type { ProviderCredential } from './providers/types';

const sanitizeArray = (value?: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value
    .map((entry) => (typeof entry === 'string' ? safeTrim(entry) : ''))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 6);
};

const trimmedOr = (value?: unknown, fallback = ''): string => {
  if (typeof value !== 'string') {
    return fallback;
  }
  return safeTrim(value);
};

const parseResponse = (content: string, model: string): StoryCheckpointResponseBody => {
  let payload = stripMarkdownFences(content);
  const extracted = extractJsonObject(payload);
  if (extracted) {
    payload = extracted;
  }

  const parsed = JSON.parse(payload);
  const segment = trimmedOr(parsed.segment);
  if (!segment) {
    throw new Error('Segment missing from AI response');
  }

  return {
    segment,
    highlights: sanitizeArray(parsed.highlights, []),
    majorEvents: sanitizeArray(parsed.majorEvents, []),
    includedEvents: typeof parsed.includedEvents === 'number' ? parsed.includedEvents : 0,
    includedDecisions: typeof parsed.includedDecisions === 'number' ? parsed.includedDecisions : 0,
    lastEventTimestamp: trimmedOr(parsed.lastEventTimestamp),
    // Record the model the default client actually runs on, not whatever the AI
    // echoed back. The prompt used to carry a stale "gemini-1.5-pro" example and
    // the model dutifully repeated it, mislabelling every checkpoint (#1430 F37).
    model,
  };
};

export const generateStoryCheckpointSummary = async (
  payload: StoryCheckpointRequestBody,
  apiKey?: ProviderCredential | null,
  model?: string | null,
): Promise<StoryCheckpointResponseBody> => {
  const client = createDefaultGeminiClient(apiKey, model);
  const prompt = getNarrativeTemplate('narrative/storyCheckpoint')({
    checkpoint: payload,
    checkpointToneInstructions: payload.toneSettings
      ? getDetailedToneInstructions(
          payload.toneSettings.contentRating, payload.toneSettings.narrativeStyle,
          payload.toneSettings.languageComplexity, payload.toneSettings.customInstructions,
        )
      : 'Tone: balanced and reader-friendly. Language complexity: moderate. Keep content appropriate for general audiences (PG).',
  });

  const response = await client.generateContent(prompt);

  if (isFeatureEnabled('CHAPTERS') && payload.mode === 'chapter') {
    let chapterRecap = fallbackChapterRecap(payload);
    let usedFallback = true;
    try {
      const parsed = JSON.parse(extractJsonObject(stripMarkdownFences(response.content)) || response.content);
      const recap = parsed.recap;
      if (recap && ['previously', 'whereItStopped', 'cast', 'holding', 'openThreads'].every(
        key => typeof recap[key] === 'string' && recap[key].trim()
      )) {
        chapterRecap = formatChapterRecap(recap);
        usedFallback = false;
      }
    } catch {
      // The chapter can continue from recorded canon without retrying the provider.
    }
    return {
      chapterRecap, segment: chapterRecap, highlights: [], majorEvents: [],
      includedEvents: payload.events.length, includedDecisions: payload.decisions?.length ?? 0,
      lastEventTimestamp: payload.events.at(-1)?.timestamp,
      model: usedFallback ? 'fallback' : model ?? getAIConfig().modelName,
    };
  }

  if (!response.content) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return parseResponse(response.content, model ?? getAIConfig().modelName);
  } catch {
    // Fallback: create a simple segment from event descriptions
    const eventText = payload.events
      .map((event) => `${event.characterName ? `${event.characterName} ` : ''}${event.description}`)
      .join('. ');

    return {
      segment: eventText || 'Recent events logged, but no summary was generated.',
      highlights: sanitizeArray(payload.events.map((event) => event.description).slice(0, 3)),
      majorEvents: sanitizeArray(payload.events.map((event) => event.description)),
      includedEvents: payload.events.length,
      includedDecisions: payload.decisions?.length ?? 0,
      lastEventTimestamp: payload.events[0]?.timestamp,
      model: 'fallback',
    };
  }
};
