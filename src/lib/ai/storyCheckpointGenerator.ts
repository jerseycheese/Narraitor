import { createDefaultGeminiClient } from './defaultGeminiClient';
import { StoryCheckpointRequestBody, StoryCheckpointResponseBody } from '@/types/story-checkpoint.types';
import { safeTrim } from '@/lib/utils';

const RESPONSE_SCHEMA = `{
  "summary": "2-3 sentences explaining the story state so far",
  "highlights": ["3 bullets distilling the most consequential beats"],
  "majorEvents": ["Chronological recap of major events"],
  "characterDevelopment": ["Statements about character growth or setbacks"],
  "nextHooks": ["Concrete story hooks or questions to pursue next"],
  "themes": ["Optional list of tonal throughlines"],
  "includedEvents": 3,
  "includedDecisions": 1,
  "lastEventTimestamp": "2025-11-20T15:31:39Z",
  "model": "gemini-1.5-pro"
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
  const summary = payload.narrativeSummary || 'Not provided';
  const location = payload.currentLocation || 'Unknown';
  const goals = payload.activeGoals && payload.activeGoals.length > 0
    ? payload.activeGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')
    : 'No explicit goals documented.';

  const protagonistLabel = payload.characterName || 'the protagonist';
  const previousStory = payload.previousCheckpointSummary
    ? `\nPREVIOUS STORY SO FAR (DO NOT EDIT THIS TEXT):\n<<<PREVIOUS_SUMMARY>>>\n${payload.previousCheckpointSummary}\n<<<END_PREVIOUS_SUMMARY>>>\n`
    : '';

  return `You are Narraitor's narrative continuity analyst. Use supplied events and decisions to create a checkpoint recap that preserves long-form campaign stakes.

Context:
- World ID: ${payload.worldId}
- Session ID: ${payload.sessionId}
- Active Character ID: ${payload.characterId || 'unknown'}
- Active Character Name: ${protagonistLabel}
- Current Location: ${location}
- Current Narrative Summary: ${summary}
- Active Goals:\n${goals}${previousStory}
Major Events Since Last Checkpoint:\n${eventsText}

Player Decisions:\n${decisionText}

Requirements:
- Only use provided inputs. Do NOT invent events or decisions.
- Treat major events as the authoritative canon. Reference decisions only if they caused the events.
- Highlight character transformations, world changes, and critical turning points explicitly.
- ${
    payload.previousCheckpointSummary
      ? `CRITICAL SUMMARY INSTRUCTION:
  1. Copy the text between <<<PREVIOUS_SUMMARY>>> markers exactly as-is (including punctuation, casing, spacing).
  2. Paste that text at the very beginning of summary without changes.
  3. After the copied text, add two new sentences (50-75 words total) describing ONLY the new events provided above.
  4. Do NOT merge, paraphrase, or rewrite the previous text. The final summary must be: [unchanged previous text] + [blank line or space] + [new sentences].`
      : 'Create an initial story summary from the provided events (no more than 75 words).'
  }
- Always refer to the protagonist by name ("${protagonistLabel}") instead of saying "the player" or using second person.
- Use third-person limited voice that can be read aloud to players.
- Return STRICT JSON shaped like the schema below. Do not wrap in markdown fences.

Schema:
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

const parseResponse = (content: string): StoryCheckpointResponseBody => {
  let payload = content.trim();
  if (payload.startsWith('```')) {
    payload = payload.replace(/^```json?/i, '').replace(/```$/, '').trim();
  }
  const jsonStart = payload.indexOf('{');
  const jsonEnd = payload.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    payload = payload.slice(jsonStart, jsonEnd + 1);
  }

  const parsed = JSON.parse(payload);
  const summary = sanitizeString(parsed.summary);
  if (!summary) {
    throw new Error('Summary missing from AI response');
  }

  return {
    summary,
    highlights: sanitizeArray(parsed.highlights, []),
    majorEvents: sanitizeArray(parsed.majorEvents, []),
    characterDevelopment: sanitizeArray(parsed.characterDevelopment, []),
    nextHooks: sanitizeArray(parsed.nextHooks, []),
    themes: sanitizeArray(parsed.themes, []),
    includedEvents: typeof parsed.includedEvents === 'number' ? parsed.includedEvents : 0,
    includedDecisions: typeof parsed.includedDecisions === 'number' ? parsed.includedDecisions : 0,
    lastEventTimestamp: sanitizeString(parsed.lastEventTimestamp),
    model: sanitizeString(parsed.model),
  };
};

export const generateStoryCheckpointSummary = async (
  payload: StoryCheckpointRequestBody,
): Promise<StoryCheckpointResponseBody> => {
  const client = createDefaultGeminiClient();
  const prompt = buildPrompt(payload);
  const response = await client.generateContent(prompt);

  if (!response.content) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return parseResponse(response.content);
  } catch {
    const eventText = payload.events
      .map((event) => `${event.characterName ? `${event.characterName} ` : ''}${event.description}`)
      .join(' ');

    const fallbackSummary = payload.previousCheckpointSummary
      ? `${payload.previousCheckpointSummary.trim()} ${eventText}`.trim()
      : eventText;

    return {
      summary: fallbackSummary || 'Recent events logged but AI summary unavailable.',
      highlights: sanitizeArray(payload.events.map((event) => event.description).slice(0, 3)),
      majorEvents: sanitizeArray(payload.events.map((event) => event.description)),
      characterDevelopment: [],
      nextHooks: [],
      themes: [],
      includedEvents: payload.events.length,
      includedDecisions: payload.decisions?.length ?? 0,
      lastEventTimestamp: payload.events[0]?.timestamp,
      model: 'fallback',
    };
  }
};
