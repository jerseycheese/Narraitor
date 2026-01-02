/**
 * Helper to include lore context in AI prompts
 */

import { useLoreStore } from '@/state/loreStore';
import type { EntityID, LoreUsageSource } from '@/types';

export interface LoreContextUsageOptions {
  recordUsage?: boolean;
  source?: LoreUsageSource;
}

/**
 * Get lore context string for AI prompt inclusion
 */
export function getLoreContextForPrompt(
  worldId: EntityID,
  sessionId?: EntityID,
  options?: LoreContextUsageOptions
): string {
  const { getLoreContext, recordLoreUsage } = useLoreStore.getState();
  const context = getLoreContext(worldId, sessionId);

  if (context.factCount === 0) {
    return '';
  }

  if (
    options?.recordUsage &&
    context.factIds &&
    context.factIds.length > 0 &&
    process.env.NODE_ENV !== 'production'
  ) {
    recordLoreUsage({
      worldId,
      sessionId,
      factIds: context.factIds,
      source: options.source,
    });
  }

  return `\nEstablished World Facts:\n${context.facts.join('\n')}\n`;
}

export function checkAndRecordLoreMentions(
  worldId: EntityID,
  sessionId: EntityID | undefined,
  responseText: string,
  source: LoreUsageSource
): void {
  if (process.env.NODE_ENV === 'production' || !responseText) return;

  const { getLoreContext, recordLoreMentions } = useLoreStore.getState();
  const context = getLoreContext(worldId, sessionId);

  if (context.factIds && context.factIds.length > 0) {
    recordLoreMentions({
      worldId,
      sessionId,
      factIds: context.factIds,
      responseText,
      source
    });
  }
}
