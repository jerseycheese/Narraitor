'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DevToolsSection } from '../shared/DevToolsSection';
import { JsonViewer } from '../JsonViewer';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { DecisionRelevanceCalculator } from '@/lib/ai/decisionRelevanceCalculator';
import type { CurrentNarrativeContext, DecisionRelevanceResult } from '@/types/relevance.types';
import type { PlayerDecision } from '@/types/personalization.types';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils/classNames';
import { useShallow } from 'zustand/react/shallow';

const DISPLAY_LIMIT = 12;

type ScoreColumnKey =
  | 'overallScore'
  | 'recencyScore'
  | 'contextScore'
  | 'impactScore'
  | 'tagMatchScore'
  | 'characterScore';

const SCORE_COLUMNS: Array<{ key: ScoreColumnKey; label: string }> = [
  { key: 'overallScore', label: 'Overall' },
  { key: 'recencyScore', label: 'Recency' },
  { key: 'contextScore', label: 'Context' },
  { key: 'impactScore', label: 'Impact' },
  { key: 'tagMatchScore', label: 'Tags' },
  { key: 'characterScore', label: 'Characters' },
];

interface ContextParams {
  sessionId: string;
  worldId: string;
  segments: NarrativeSegment[];
  decisions: PlayerDecision[];
}

function formatScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return '—';
  return values.join(', ');
}

function buildRelevanceContext({
  sessionId,
  worldId,
  segments,
  decisions,
}: ContextParams): CurrentNarrativeContext {
  const sortedDecisions = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestDecision = sortedDecisions[0];

  let location: string | undefined;
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (segment?.metadata?.location) {
      location = segment.metadata.location;
      break;
    }
  }
  if (!location && latestDecision?.context?.location) {
    location = latestDecision.context.location;
  }

  const characterSet = new Set<string>();
  segments.forEach((segment) => {
    segment.characterIds?.forEach((id) => characterSet.add(id));
    segment.metadata?.characterIds?.forEach((id) => characterSet.add(id));
  });
  if (characterSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      decision.context.charactersPresent?.forEach((char) => characterSet.add(char));
    });
  }

  const situation =
    sortedDecisions.find((decision) => Boolean(decision.context.situation))?.context.situation;

  const recentEvents = segments
    .slice(-5)
    .map((segment) => segment.content?.substring(0, 120))
    .filter(Boolean);

  const tagSet = new Set<string>();
  segments.forEach((segment) => {
    segment.metadata?.tags?.forEach((tag) => {
      if (tag) tagSet.add(tag);
    });
  });
  if (tagSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      if (decision.choiceType) tagSet.add(decision.choiceType);
      decision.context.situation
        ?.split(/\s+/)
        .filter((word) => word.length > 4)
        .forEach((word) => tagSet.add(word.toLowerCase()));
    });
  }

  const contextTimestamp = (() => {
    const latestSegment = segments[segments.length - 1];
    if (latestSegment?.timestamp instanceof Date) {
      return latestSegment.timestamp.toISOString();
    }
    if (latestSegment?.timestamp && typeof latestSegment.timestamp === 'string') {
      return new Date(latestSegment.timestamp).toISOString();
    }
    if (latestDecision?.timestamp) {
      return new Date(latestDecision.timestamp).toISOString();
    }
    return getTimestamp();
  })();

  return {
    location,
    charactersPresent: Array.from(characterSet).slice(0, 10),
    situation,
    recentEvents,
    activeTags: Array.from(tagSet).slice(0, 15),
    worldId,
    sessionId,
    timestamp: contextTimestamp,
  };
}

export const RelevanceDebuggerSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [decisions, setDecisions] = useState<PlayerDecision[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [scope, setScope] = useState<'session' | 'world' | 'all'>('session');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const { id: activeSessionId, worldId: activeSessionWorldId } = useSessionStore(
    useShallow((state) => ({
      id: state.id,
      worldId: state.worldId,
    }))
  );

  const { segments, sessionSegments } = useNarrativeStore(
    useShallow((state) => ({
      segments: state.segments,
      sessionSegments: state.sessionSegments,
    }))
  );

  const worlds = useWorldStore((state) => state.worlds);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      setDecisions(playerDecisionTracker.getAllDecisions());
    } catch (error) {
      console.warn('[DevTools] Failed to load player decisions for relevance debugger', error);
      setDecisions([]);
    }
  }, [isMounted, refreshVersion]);

  const availableSessions = useMemo(() => {
    const uniqueSessions = new Set<string>();
    decisions.forEach((decision) => uniqueSessions.add(decision.sessionId));
    return Array.from(uniqueSessions).sort();
  }, [decisions]);

  const availableWorlds = useMemo(() => {
    const uniqueWorlds = new Set<string>();
    decisions.forEach((decision) => uniqueWorlds.add(decision.worldId));
    return Array.from(uniqueWorlds).sort();
  }, [decisions]);

  useEffect(() => {
    if (!isMounted || availableSessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }
    setSelectedSessionId((prev) => {
      if (prev && availableSessions.includes(prev)) {
        return prev;
      }
      if (activeSessionId && availableSessions.includes(activeSessionId)) {
        return activeSessionId;
      }
      return availableSessions[0];
    });
  }, [availableSessions, activeSessionId, isMounted]);

  useEffect(() => {
    if (!isMounted || availableWorlds.length === 0) {
      setSelectedWorldId(null);
      return;
    }
    setSelectedWorldId((prev) => {
      if (prev && availableWorlds.includes(prev)) {
        return prev;
      }
      if (activeSessionWorldId && availableWorlds.includes(activeSessionWorldId)) {
        return activeSessionWorldId;
      }
      return availableWorlds[0];
    });
  }, [availableWorlds, activeSessionWorldId, isMounted]);

  const filteredDecisions = useMemo(() => {
    if (scope === 'session') {
      if (!selectedSessionId) return [];
      return decisions.filter((decision) => decision.sessionId === selectedSessionId);
    }
    if (scope === 'world') {
      if (!selectedWorldId) return [];
      return decisions.filter((decision) => decision.worldId === selectedWorldId);
    }
    return decisions;
  }, [decisions, scope, selectedSessionId, selectedWorldId]);

  const fallbackDecision = filteredDecisions[0] ?? decisions[0];
  const contextSessionId = selectedSessionId ?? fallbackDecision?.sessionId ?? 'unknown-session';
  const contextWorldId =
    selectedWorldId ?? fallbackDecision?.worldId ?? activeSessionWorldId ?? 'unknown-world';

  const contextSegments = useMemo(() => {
    const ids = sessionSegments[contextSessionId] ?? [];
    return ids
      .map((segmentId) => segments[segmentId])
      .filter(Boolean) as NarrativeSegment[];
  }, [contextSessionId, sessionSegments, segments]);

  const contextDecisions = filteredDecisions.length > 0 ? filteredDecisions : decisions;

  const currentContext = useMemo<CurrentNarrativeContext | null>(() => {
    if (contextDecisions.length === 0) {
      return null;
    }
    return buildRelevanceContext({
      sessionId: contextSessionId,
      worldId: contextWorldId,
      segments: contextSegments,
      decisions: contextDecisions,
    });
  }, [contextDecisions, contextSegments, contextSessionId, contextWorldId]);

  const calculator = useMemo(() => new DecisionRelevanceCalculator(), []);

  const analysis = useMemo<DecisionRelevanceResult | null>(() => {
    if (!currentContext || filteredDecisions.length === 0) {
      return null;
    }
    return calculator.analyzeDecisionRelevance(filteredDecisions, currentContext);
  }, [calculator, currentContext, filteredDecisions]);

  const topDecisions = useMemo(() => {
    if (!analysis) return [];
    return analysis.rankedDecisions.slice(0, DISPLAY_LIMIT);
  }, [analysis]);

  useEffect(() => {
    if (!analysis || topDecisions.length === 0) {
      setSelectedDecisionId(null);
      return;
    }
    setSelectedDecisionId((prev) => {
      if (prev && topDecisions.some((entry) => entry.decision.id === prev)) {
        return prev;
      }
      return topDecisions[0].decision.id;
    });
  }, [analysis, topDecisions]);

  const selectedDecision = useMemo(() => {
    if (!selectedDecisionId) return null;
    return topDecisions.find((entry) => entry.decision.id === selectedDecisionId) ?? null;
  }, [selectedDecisionId, topDecisions]);

  if (!isMounted) {
    return (
      <DevToolsSection title="Decision Relevance Debugger">
        <div className="text-xs text-gray-700">Loading relevance data…</div>
      </DevToolsSection>
    );
  }

  const displayWorldName = (worldId: string | null) => {
    if (!worldId) return 'All worlds';
    const world = worlds[worldId];
    return world ? `${world.name} (${worldId})` : worldId;
  };

  return (
    <div data-testid="relevance-debugger-section" className="space-y-4">
      <DevToolsSection title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-900">
          <div className="flex flex-col space-y-1">
            <label className="font-medium" htmlFor="relevance-scope">
              Scope
            </label>
            <Select
              id="relevance-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as typeof scope)}
              className="text-xs"
            >
              <option value="session">Active session</option>
              <option value="world">World</option>
              <option value="all">All decisions</option>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="font-medium" htmlFor="relevance-session">
              Session
            </label>
            <Select
              id="relevance-session"
              value={selectedSessionId ?? ''}
              onChange={(event) => setSelectedSessionId(event.target.value || null)}
              disabled={availableSessions.length === 0}
              className="text-xs"
            >
              {availableSessions.length === 0 && <option value="">No sessions</option>}
              {availableSessions.map((sessionId) => (
                <option key={sessionId} value={sessionId}>
                  {sessionId}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="font-medium" htmlFor="relevance-world">
              World
            </label>
            <Select
              id="relevance-world"
              value={selectedWorldId ?? ''}
              onChange={(event) => setSelectedWorldId(event.target.value || null)}
              disabled={availableWorlds.length === 0}
              className="text-xs"
            >
              {availableWorlds.length === 0 && <option value="">No worlds</option>}
              {availableWorlds.map((worldId) => (
                <option key={worldId} value={worldId}>
                  {displayWorldName(worldId)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="font-medium">Context overview</span>
            <div className="text-gray-700">
              Session: {contextSessionId}
              <br />
              World: {displayWorldName(contextWorldId)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setRefreshVersion((prev) => prev + 1)}
          >
            Refresh decisions
          </Button>
          <div className="text-xs text-gray-700">
            Showing {filteredDecisions.length} decision
            {filteredDecisions.length === 1 ? '' : 's'} in scope
          </div>
        </div>
      </DevToolsSection>

      <DevToolsSection title="Relevance Scores">
        {analysis ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-900 mb-3">
              <div data-testid="relevance-summary-total">
                <div className="font-semibold text-sm">Total decisions</div>
                <div>{analysis.totalDecisions}</div>
              </div>
              <div data-testid="relevance-summary-relevant">
                <div className="font-semibold text-sm">Above threshold</div>
                <div>{analysis.relevantDecisions}</div>
              </div>
              <div data-testid="relevance-summary-average">
                <div className="font-semibold text-sm">Average score</div>
                <div>{formatScore(analysis.averageScore)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full border border-gray-300 text-xs"
                data-testid="relevance-scores-table"
              >
                <thead className="bg-gray-200 text-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left">Decision</th>
                    {SCORE_COLUMNS.map((column) => (
                      <th key={column.key as string} className="px-3 py-2 text-right">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topDecisions.map(({ decision, score }) => {
                    const isSelected = decision.id === selectedDecisionId;
                    return (
                      <tr
                        key={decision.id}
                        className={cn(
                          'border-t border-gray-200 cursor-pointer hover:bg-gray-200',
                          isSelected && 'bg-gray-300'
                        )}
                        onClick={() => setSelectedDecisionId(decision.id)}
                        data-testid={`relevance-row-${decision.id}`}
                      >
                        <td className="px-3 py-2 text-gray-900">
                          <div className="font-medium">{decision.prompt}</div>
                          <div className="text-gray-700">{decision.choiceText}</div>
                        </td>
                        {SCORE_COLUMNS.map((column) => (
                          <td key={column.key as string} className="px-3 py-2 text-right">
                            {formatScore(score[column.key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-700">
            {filteredDecisions.length === 0
              ? 'No decisions available for the selected scope yet.'
              : 'Waiting for context data. Refresh once the session has narrative segments.'}
          </div>
        )}
      </DevToolsSection>

      {selectedDecision && (
        <DevToolsSection title="Selected Decision Details">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-900"
            data-testid="relevance-details"
          >
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Prompt</div>
                <div>{selectedDecision.decision.prompt}</div>
              </div>
              <div>
                <div className="font-semibold">Choice</div>
                <div>{selectedDecision.decision.choiceText}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-semibold">Overall</div>
                  <div>{formatScore(selectedDecision.score.overallScore)}</div>
                </div>
                <div>
                  <div className="font-semibold">Days since decision</div>
                  <div>{selectedDecision.score.metadata?.daysSinceDecision ?? '—'}</div>
                </div>
                <div>
                  <div className="font-semibold">Matched tags</div>
                  <div>{formatList(selectedDecision.score.metadata?.matchedTags)}</div>
                </div>
                <div>
                  <div className="font-semibold">Impact category</div>
                  <div>{selectedDecision.score.metadata?.impactCategory ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="font-semibold">Decision context</div>
                <JsonViewer data={selectedDecision.decision.context} className="bg-white" />
              </div>
              <div>
                <div className="font-semibold">Current narrative context</div>
                <JsonViewer data={currentContext ?? {}} className="bg-white" />
              </div>
            </div>
          </div>
        </DevToolsSection>
      )}
    </div>
  );
};
