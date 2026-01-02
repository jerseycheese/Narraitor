import { useMemo } from 'react';
import type {
  LoreCategory,
  LoreFact,
  LoreSearchOptions,
  LoreUsageEvent,
  LoreUsageStats
} from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

interface UseLoreManagementDataInput {
  selectedWorldId: EntityID;
  searchQuery: string;
  categoryFilter: LoreCategory | '';
  visibilityFilter: 'all' | 'session-private' | 'world-shared';
  sessionFilter: 'all' | 'current' | EntityID;
  currentSessionId?: EntityID;
  allFacts: Record<EntityID, LoreFact>;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  searchFacts: (query: string, options?: LoreSearchOptions) => LoreFact[];
  loreUsage: Record<EntityID, LoreUsageStats>;
  loreUsageEvents: LoreUsageEvent[];
}

interface VisibilityStats {
  total: number;
  worldShared: number;
  sessionPrivate: number;
  narrativeWorldShared: number;
  narrativeSessionPrivate: number;
}

export function useLoreManagementData({
  selectedWorldId,
  searchQuery,
  categoryFilter,
  visibilityFilter,
  sessionFilter,
  currentSessionId,
  allFacts,
  getFacts,
  searchFacts,
  loreUsage,
  loreUsageEvents,
}: UseLoreManagementDataInput) {
  const sessionOptions = useMemo(() => {
    if (!selectedWorldId) return [] as EntityID[];
    const ids = new Set(
      Object.values(allFacts)
        .filter((fact) => fact.worldId === selectedWorldId && fact.sessionId)
        .map((fact) => fact.sessionId as EntityID)
    );
    return Array.from(ids).sort();
  }, [allFacts, selectedWorldId]);

  const effectiveSessionId = useMemo(() => {
    if (sessionFilter === 'current') {
      return currentSessionId || undefined;
    }
    if (sessionFilter === 'all') return undefined;
    return sessionFilter;
  }, [sessionFilter, currentSessionId]);

  const facts = useMemo(() => {
    if (!selectedWorldId) return [] as LoreFact[];

    let filtered = searchQuery
      ? searchFacts(searchQuery, {
          worldId: selectedWorldId,
          category: categoryFilter || undefined,
          sessionId: effectiveSessionId
        })
      : getFacts({
          worldId: selectedWorldId,
          category: categoryFilter || undefined,
          sessionId: effectiveSessionId
        });

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((fact) => fact.visibility === visibilityFilter);
    }

    return filtered;
  }, [selectedWorldId, searchQuery, categoryFilter, visibilityFilter, effectiveSessionId, getFacts, searchFacts]);

  const usageFacts = useMemo(() => {
    if (!selectedWorldId) return [] as LoreFact[];

    let filtered = getFacts({
      worldId: selectedWorldId,
      category: categoryFilter || undefined,
      sessionId: effectiveSessionId
    });

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((fact) => fact.visibility === visibilityFilter);
    }

    return filtered;
  }, [selectedWorldId, categoryFilter, visibilityFilter, effectiveSessionId, getFacts]);

  const usageRows = useMemo(() => {
    return usageFacts
      .map((fact) => {
        const stats: LoreUsageStats = loreUsage[fact.id] ?? {
          usageCount: 0,
          mentionCount: 0
        };
        return { fact, stats };
      })
      .sort((a, b) => {
        if (a.stats.usageCount !== b.stats.usageCount) {
          return b.stats.usageCount - a.stats.usageCount;
        }
        return b.stats.mentionCount - a.stats.mentionCount;
      });
  }, [usageFacts, loreUsage]);

  const usageSummary = useMemo(() => {
    const totalFacts = usageFacts.length;
    const usedFacts = usageRows.filter((row) => row.stats.usageCount > 0).length;
    const totalMentions = usageRows.reduce((sum, row) => sum + row.stats.mentionCount, 0);
    const lastUsedAt = usageRows
      .map((row) => row.stats.lastUsedAt)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      totalFacts,
      usedFacts,
      totalMentions,
      lastUsedAt
    };
  }, [usageFacts, usageRows]);

  const usageEvents = useMemo(() => {
    if (!selectedWorldId) return [] as LoreUsageEvent[];
    let events = loreUsageEvents.filter((event) => event.worldId === selectedWorldId);
    if (effectiveSessionId) {
      events = events.filter((event) => event.sessionId === effectiveSessionId);
    }
    return events.slice(0, 20);
  }, [selectedWorldId, effectiveSessionId, loreUsageEvents]);

  const visibilityStats = useMemo<VisibilityStats>(() => {
    if (!selectedWorldId) {
      return {
        total: 0,
        worldShared: 0,
        sessionPrivate: 0,
        narrativeWorldShared: 0,
        narrativeSessionPrivate: 0,
      };
    }

    const worldFacts = getFacts({ worldId: selectedWorldId });
    return worldFacts.reduce(
      (acc, fact) => {
        acc.total += 1;
        if (fact.visibility === 'world-shared') {
          acc.worldShared += 1;
          if (fact.source === 'narrative') acc.narrativeWorldShared += 1;
        } else {
          acc.sessionPrivate += 1;
          if (fact.source === 'narrative') acc.narrativeSessionPrivate += 1;
        }
        return acc;
      },
      {
        total: 0,
        worldShared: 0,
        sessionPrivate: 0,
        narrativeWorldShared: 0,
        narrativeSessionPrivate: 0,
      }
    );
  }, [selectedWorldId, getFacts]);

  const factsByCategory = useMemo(() => {
    const grouped: Record<LoreCategory, LoreFact[]> = {
      characters: [],
      locations: [],
      events: [],
      rules: []
    };

    facts.forEach((fact) => {
      grouped[fact.category].push(fact);
    });

    return grouped;
  }, [facts]);

  return {
    sessionOptions,
    effectiveSessionId,
    facts,
    factsByCategory,
    visibilityStats,
    usageSummary,
    usageRows,
    usageEvents,
  };
}
