import { createDefaultGeminiClient } from './defaultGeminiClient';
import { StoryCheckpointRequestBody, StoryCheckpointResponseBody } from '@/types/story-checkpoint.types';
import { safeTrim } from '@/lib/utils';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import fs from 'fs';
import path from 'path';

const RESPONSE_SCHEMA = `{
  "segment": "2-3 sentences (50-75 words) summarizing ONLY the events provided in this checkpoint",
  "highlights": ["3 bullets distilling the most consequential beats from these events"],
  "majorEvents": ["Chronological recap of the major events in this checkpoint"],
  "characterDevelopment": ["Statements about character growth or setbacks from these events"],
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
  const segment = sanitizeString(parsed.segment);
  if (!segment) {
    throw new Error('Segment missing from AI response');
  }

  return {
    segment,
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

  console.log('🔍 GENERATOR DEBUG - Prompt Context:', {
    eventsCount: payload.events.length,
    events: payload.events.map(e => e.description),
    previousSegmentsCount: payload.previousSegments?.length ?? 0,
    previousSegments: payload.previousSegments?.map((seg, i) => `[${i + 1}] ${seg.substring(0, 100)}...`),
  });

  const response = await client.generateContent(prompt);

  if (!response.content) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return parseResponse(response.content);
  } catch {
    // Fallback: create a simple segment from event descriptions
    const eventText = payload.events
      .map((event) => `${event.characterName ? `${event.characterName} ` : ''}${event.description}`)
      .join('. ');

    return {
      segment: eventText || 'Recent events logged but AI summary unavailable.',
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
