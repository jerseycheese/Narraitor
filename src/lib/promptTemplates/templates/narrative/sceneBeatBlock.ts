import { isFeatureEnabled } from '@/lib/featureFlags';
import type { NarrativeTemplateContext } from './context';

/** Renders completed events as settled facts and requests only newly completed beats. */
export function sceneBeatBlock(context: NarrativeTemplateContext): string {
  if (!isFeatureEnabled('SCENE_STATE')) return '';
  const beats = context.narrativeContext?.sceneState?.completedBeats ?? [];
  return `
SETTLED SCENE BEATS (these events have already happened):
${beats.length ? beats.map((beat) => `- [${beat.id}] (turn ${beat.turnIndex}): ${beat.text}`).join('\n') : 'None recorded yet.'}
Treat these events as settled fact. You may refer to their consequences, but never replay them as new events or give an established event a new ID.
Only when this segment completes a new arrival, departure, reveal, death, or decision of record, report metadata.sceneBeat as an object with id (a stable lowercase-hyphenated event ID) and text (a short statement of what happened). Omit sceneBeat when no new beat completes, including setup, plans, memories, and repeated references. Never include an already-recorded ID. Keep IDs in metadata, never in prose.
`;
}
