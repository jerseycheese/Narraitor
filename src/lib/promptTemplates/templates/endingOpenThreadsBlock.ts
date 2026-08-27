import type { WorldClockPromptContext } from '@/types/worldThread.types';
import { KIND_LABEL } from './narrative/worldClockBlock';

/**
 * Open story threads and resolution rules for ending generation.
 *
 * Renders nothing when the context is absent or has no threads, ensuring
 * existing prompt paths without threads remain byte-identical.
 */
export const endingOpenThreadsBlock = (worldClock?: WorldClockPromptContext): string => {
  if (!worldClock || worldClock.threads.length === 0) return '';

  const threadLines = worldClock.threads
    .map((thread) => {
      const age = thread.ageTurns === 1 ? '1 turn' : `${thread.ageTurns} turns`;
      const overdue = thread.overdue ? ' [OVERDUE]' : '';
      return `- (${KIND_LABEL[thread.kind]}, open ${age}) ${thread.summary}${overdue}`;
    })
    .join('\n');

  return `
OPEN STORY THREADS (unresolved business from this session):
${threadLines}

RULES FOR OPEN THREADS:
- Each listed thread must be resolved on the page or explicitly named as unresolved. Silence is not allowed. "Still out there" is an acceptable answer; omission is not.
- Achievements, legacy and world-impact claims must trace to a story-summary line, a journal entry, or a thread above. No prior history, lore or reputation this session did not establish.
`;
};
