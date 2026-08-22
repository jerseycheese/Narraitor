import { createDefaultGeminiClient } from './defaultGeminiClient';
import { getAIConfig } from './config';
import { StoryCheckpointRequestBody, StoryCheckpointResponseBody } from '@/types/story-checkpoint.types';
import { safeTrim } from '@/lib/utils';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { stripMarkdownFences, extractJsonObject } from './parseJSON';
import type { ProviderCredential } from './providers/types';

const RESPONSE_SCHEMA = `{
  "segment": "2-3 sentences (50-75 words) summarizing ONLY the events provided in this checkpoint",
  "highlights": ["3 bullets distilling the most consequential beats from these events"],
  "majorEvents": ["Chronological recap of the major events in this checkpoint"],
  "includedEvents": 3,
  "includedDecisions": 1,
  "lastEventTimestamp": "2025-11-20T15:31:39Z"
}`;

const formatEvents = (events: StoryCheckpointRequestBody['events']): string => {
  return events
    .map((event, index) => {
      const parts = [
        `${index + 1}. [${event.timestamp}]`,
        event.characterName ? `${event.characterName}:` : undefined,
        event.description,
      ].filter(Boolean);
      return parts.join(' ');
    })
    .join('\n');
};

const formatDecisions = (decisions: StoryCheckpointRequestBody['decisions']): string => {
  if (!decisions || decisions.length === 0) {
    return 'None recorded.';
  }

  return decisions
    .map((decision, index) => {
      const consequence = decision.consequence ? ` → Consequence: ${decision.consequence}` : '';
      return `${index + 1}. ${decision.text}${consequence}`;
    })
    .join('\n');
};

const buildPrompt = (payload: StoryCheckpointRequestBody): string => {
  const eventsText = formatEvents(payload.events);
  const decisionText = formatDecisions(payload.decisions ?? []);
  const location = payload.currentLocation || 'Unknown';
  const goals = payload.activeGoals && payload.activeGoals.length > 0
    ? payload.activeGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')
    : 'No explicit goals documented.';
  const toneDirectives = payload.toneSettings
    ? getDetailedToneInstructions(
        payload.toneSettings.contentRating,
        payload.toneSettings.narrativeStyle,
        payload.toneSettings.languageComplexity,
        payload.toneSettings.customInstructions
      )
    : 'Tone: balanced and reader-friendly. Language complexity: moderate. Keep content appropriate for general audiences (PG).';

  // Build recent story context if available
  const storyContext = payload.previousSegments && payload.previousSegments.length > 0
    ? `\nRECENT STORY (for context only - DO NOT retell this):\n${payload.previousSegments.join('\n\n')}\n`
    : '';

  return `You are writing an ongoing story. ${storyContext ? 'Continue the narrative naturally from where it left off.' : 'Begin the story with this opening scene.'}

${storyContext}
Setting Context:
- Location: ${location}
- Active Goals: ${goals}
${payload.characterName ? `- Protagonist: ${payload.characterName}` : '- Protagonist: [unnamed character]'}

NEW EVENTS (write the next beat of the story based on these):
${eventsText}
${decisionText ? `\nPlayer Decisions:\n${decisionText}` : ''}

NARRATIVE WRITING REQUIREMENTS:
${storyContext ? `- Build naturally from the recent story above - DO NOT retell or re-summarize what already happened
- Write what happens NEXT as a continuation of the ongoing narrative
- Use transitions and connective phrases to flow from the previous beat` : '- Set the opening scene for this new story'}
- Apply these tone and language rules: ${toneDirectives}
- Write in a continuous narrative style, like a novel, not a summary or timeline
- Vary sentence structure: mix short punchy sentences with longer flowing ones
- Create cause-and-effect flow: show how events connect and build on each other
- Maintain tension and pacing appropriate to the action
- Length: 50-75 words (approximately 2-3 sentences)
- Treat the events listed above as authoritative canon
${payload.characterName ? `- Refer to the protagonist naturally: ${storyContext ? `since this continues an ongoing story, use first name only ("${payload.characterName.split(' ')[0]}") or pronouns (she/he/they) throughout` : `use "${payload.characterName}" for the first reference in this opening segment, then use first name only ("${payload.characterName.split(' ')[0]}") or pronouns (she/he/they) for subsequent references`}` : '- Use third-person pronouns for the protagonist'}
- Write ONLY in past tense (was/were, did, had) - NEVER present tense (is/are, does, has)
- Use third-person limited perspective that can be read aloud

EXAMPLE OF GOOD NARRATIVE FLOW:
Instead of: "The hero entered the tavern. The hero ordered a drink. The hero noticed a stranger."
Write like: "The hero pushed through the tavern's creaking door, the warm firelight a stark contrast to the cold rain outside. She ordered a whiskey, neat—and that's when she noticed the hooded stranger watching from the corner booth."

Return STRICT JSON (no markdown fences):
${RESPONSE_SCHEMA}
`;
};

const sanitizeArray = (value?: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value
    .map((entry) => (typeof entry === 'string' ? safeTrim(entry) : ''))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 6);
};

const sanitizeString = (value?: unknown, fallback = ''): string => {
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
  const segment = sanitizeString(parsed.segment);
  if (!segment) {
    throw new Error('Segment missing from AI response');
  }

  return {
    segment,
    highlights: sanitizeArray(parsed.highlights, []),
    majorEvents: sanitizeArray(parsed.majorEvents, []),
    includedEvents: typeof parsed.includedEvents === 'number' ? parsed.includedEvents : 0,
    includedDecisions: typeof parsed.includedDecisions === 'number' ? parsed.includedDecisions : 0,
    lastEventTimestamp: sanitizeString(parsed.lastEventTimestamp),
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
  const prompt = buildPrompt(payload);

  const response = await client.generateContent(prompt);

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
