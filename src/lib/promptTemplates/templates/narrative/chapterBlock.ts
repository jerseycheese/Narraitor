import { isFeatureEnabled } from '@/lib/featureFlags';
import type { NarrativeTemplateContext } from './context';

/** Chapter guidance is isolated so a disabled flag contributes no bytes. */
export function chapterBlock({ chapter }: NarrativeTemplateContext): string {
  if (!isFeatureEnabled('CHAPTERS') || !chapter) return '';
  return `${chapter.recap ? `\nCHAPTER RECAP (established canon from the previous chapter):\n${chapter.recap}\n` : ''}${chapter.isOpening ? `\nCHAPTER ${chapter.number} OPENING:\nContinue from Where it stopped in the recap; carry its cast status, holdings, and open threads forward. Advance the player's current action rather than retelling the prior chapter or reintroducing the character.\n` : ''}${chapter.isEnding ? `\nCHAPTER ${chapter.number} CLOSING BEAT:\nResolve the player's immediate action and bring this chapter to a natural pause. Close the current beat while leaving unfinished threads for the next chapter. The game continues: avoid a final epilogue, retirement, or end-of-story conclusion. Keep the normal response JSON shape.\n` : ''}`;
}
