import type { EntityID } from '../types/common.types';
import type { LoreUsageEvent, LoreUsageSource, LoreUsageStats } from '../types/lore.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import type { SetState, GetState } from './loreStore.actions.types';

const MAX_LORE_USAGE_EVENTS = 200;
const MIN_MENTION_TERM_LENGTH = 3;

export const createLoreUsageActions = (set: SetState, get: GetState) => ({
  recordLoreUsage: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    source?: LoreUsageSource;
  }) => {
    const { worldId, sessionId, factIds, source } = input;
    if (!factIds || factIds.length === 0) return;

    const now = getTimestamp();
    const existingFactIds = factIds.filter((id) => id in get().facts);
    if (existingFactIds.length === 0) return;

    set((state) => {
      const updatedUsage: Record<EntityID, LoreUsageStats> = { ...state.loreUsage };

      existingFactIds.forEach((id) => {
        const previous = updatedUsage[id] ?? { usageCount: 0, mentionCount: 0 };
        updatedUsage[id] = {
          ...previous,
          usageCount: previous.usageCount + 1,
          lastUsedAt: now,
          lastSource: source ?? 'unknown',
          lastSessionId: sessionId,
        };
      });

      const usageEvent: LoreUsageEvent = {
        id: generateUniqueId('lore-usage'),
        worldId,
        sessionId,
        source: source ?? 'unknown',
        eventType: 'context',
        factIds: existingFactIds,
        timestamp: now,
      };

      return {
        loreUsage: updatedUsage,
        loreUsageEvents: [usageEvent, ...state.loreUsageEvents].slice(
          0,
          MAX_LORE_USAGE_EVENTS
        ),
      };
    });
  },

  recordLoreMentions: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    responseText: string;
    source?: LoreUsageSource;
  }) => {
    const { worldId, sessionId, factIds, responseText, source } = input;
    if (!responseText || !factIds || factIds.length === 0) return;

    const mentionedFactIds = factIds.filter((id) => {
      const fact = get().facts[id];
      if (!fact) return false;

      const terms = [fact.value, ...(fact.aliases || [])]
        .map((term) => term.trim())
        .filter((term) => term.length >= MIN_MENTION_TERM_LENGTH);

      return terms.some((term) => {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escapedTerm}\\b`, 'i');
        return pattern.test(responseText);
      });
    });

    if (mentionedFactIds.length === 0) return;

    const now = getTimestamp();
    const responseExcerpt = responseText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    set((state) => {
      const updatedUsage: Record<EntityID, LoreUsageStats> = { ...state.loreUsage };

      mentionedFactIds.forEach((id) => {
        const previous = updatedUsage[id] ?? { usageCount: 0, mentionCount: 0 };
        updatedUsage[id] = {
          ...previous,
          mentionCount: previous.mentionCount + 1,
          lastMentionedAt: now,
        };
      });

      const mentionEvent: LoreUsageEvent = {
        id: generateUniqueId('lore-mention'),
        worldId,
        sessionId,
        source: source ?? 'unknown',
        eventType: 'mention',
        factIds: mentionedFactIds,
        timestamp: now,
        responseExcerpt: responseExcerpt || undefined,
      };

      return {
        loreUsage: updatedUsage,
        loreUsageEvents: [mentionEvent, ...state.loreUsageEvents].slice(
          0,
          MAX_LORE_USAGE_EVENTS
        ),
      };
    });
  },

  clearLoreUsage: (worldId?: EntityID) => {
    if (!worldId) {
      set({ loreUsage: {}, loreUsageEvents: [] });
      return;
    }

    const worldFactIds = new Set(
      Object.values(get().facts)
        .filter((fact) => fact.worldId === worldId)
        .map((fact) => fact.id)
    );

    set((state) => ({
      loreUsage: Object.fromEntries(
        Object.entries(state.loreUsage).filter(
          ([id]) => !worldFactIds.has(id)
        )
      ),
      loreUsageEvents: state.loreUsageEvents.filter(
        (event) => event.worldId !== worldId
      ),
    }));
  },
});
