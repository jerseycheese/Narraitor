import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';
import type { NarrativeTemplateContext } from './context';
import { isFeatureEnabled } from '@/lib/featureFlags';

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

const formatDecisions = (
  decisions: StoryCheckpointRequestBody['decisions']
): string => {
  if (!decisions || decisions.length === 0) {
    return 'None recorded.';
  }

  return decisions
    .map((decision, index) => {
      const consequence = decision.consequence
        ? ` → Consequence: ${decision.consequence}`
        : '';
      return `${index + 1}. ${decision.text}${consequence}`;
    })
    .join('\n');
};

export const storyCheckpointTemplate = (
  context: NarrativeTemplateContext
): string => {
  const payload = context.checkpoint;
  if (!payload) return '';
  if (isFeatureEnabled('CHAPTERS') && payload.mode === 'chapter') {
    return chapterRecapTemplate(context);
  }
  const eventsText = formatEvents(payload.events);
  const decisionText = formatDecisions(payload.decisions ?? []);
  const location = payload.currentLocation || 'Unknown';
  const goals =
    payload.activeGoals && payload.activeGoals.length > 0
      ? payload.activeGoals
          .map((goal, index) => `${index + 1}. ${goal}`)
          .join('\n')
      : 'No explicit goals documented.';
  const toneDirectives = context.checkpointToneInstructions;

  // Build recent story context if available
  const storyContext =
    payload.previousSegments && payload.previousSegments.length > 0
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
${
  storyContext
    ? `- Build naturally from the recent story above - DO NOT retell or re-summarize what already happened
- Write what happens NEXT as a continuation of the ongoing narrative
- Use transitions and connective phrases to flow from the previous beat`
    : '- Set the opening scene for this new story'
}
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

const chapterRecapTemplate = ({
  checkpoint: payload,
}: NarrativeTemplateContext): string => {
  if (!payload) return '';
  return `Write a chapter hand-off for the next narrative prompt using ONLY this recorded canon.
Keep names, locations, cast status, held items, and unresolved threads exact. Do not invent resolutions, possessions, or hidden knowledge.
Return STRICT JSON with exactly this shape, no markdown:
{"recap":{"previously":"key events","whereItStopped":"location and last situation","cast":"names with current status","holding":"current possessions","openThreads":"unfinished business"}}
The five values together must fit in five labeled lines of at most 850 characters total. Keep each value under 150 characters. Write for continuity, not a journal or a new scene.
Previous chapter recap: ${payload.previousChapterRecap ?? 'None.'}
Chapter events:
${formatEvents(payload.events)}
Player decisions:
${formatDecisions(payload.decisions)}
Where it stopped: ${payload.currentLocation ?? 'Not recorded.'}
${payload.previousSegments?.at(-1) ?? ''}
Cast: ${payload.cast?.join('; ') || payload.characterName || 'Not recorded.'}
Holding: ${payload.holding?.join('; ') || 'None recorded.'}
Open threads: ${payload.openThreads?.join('; ') || 'None recorded.'}`;
};
