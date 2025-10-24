'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DevToolsSection } from '../shared/DevToolsSection';
import { JsonViewer } from '../JsonViewer';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { DecisionRelevanceCalculator } from '@/lib/ai/decisionRelevanceCalculator';
import {
  type CurrentNarrativeContext,
  type DecisionRelevanceResult,
  type DecisionRelevanceScore,
  type RelevanceScoringConfig,
} from '@/types/relevance.types';
import { PlayerDecision } from '@/types/personalization.types';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils/classNames';
import { useShallow } from 'zustand/react/shallow';

type WeightKey = 'recency' | 'context' | 'impact' | 'tagMatch' | 'character';
type WeightInputs = Record<WeightKey, number>;

const WEIGHT_LABELS: Record<WeightKey, string> = {
  recency: 'Recency',
  context: 'Context',
  impact: 'Impact',
  tagMatch: 'Tag Match',
  character: 'Character',
};

const SCORE_KEY_MAP: Record<WeightKey, keyof DecisionRelevanceScore> = {
  recency: 'recencyScore',
  context: 'contextScore',
  impact: 'impactScore',
  tagMatch: 'tagMatchScore',
  character: 'characterScore',
};

const MAX_TOP_N = 50;

interface ContextParams {
  sessionId: string;
  worldId: string;
  segments: NarrativeSegment[];
  decisions: PlayerDecision[];
}

function formatScore(value: number): string {
  if (Number.isNaN(value)) return '0.000';
  return value.toFixed(3);
}

function formatPercent(value: number): string {
  if (Number.isNaN(value)) return '0%';
  return `${Math.round(value * 100)}%`;
}

function normalizeWeights(inputs: WeightInputs): RelevanceScoringConfig['weights'] {
  const total = Object.values(inputs).reduce((sum, val) => sum + (Number.isFinite(val) ? val : 0), 0);
  if (total <= 0) {
    return {
      recency: 0.2,
      context: 0.2,
      impact: 0.2,
      tagMatch: 0.2,
      character: 0.2,
    };
  }

  return {
    recency: inputs.recency / total,
    context: inputs.context / total,
    impact: inputs.impact / total,
    tagMatch: inputs.tagMatch / total,
    character: inputs.character / total,
  };
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
  const charactersPresent = Array.from(characterSet).slice(0, 10);

  const situation =
    sortedDecisions.find((decision) => Boolean(decision.context.situation))?.context.situation;

  const recentEvents = segments
    .slice(-5)
    .map((segment) => segment.content?.substring(0, 120))
    .filter(Boolean);

  const tagSet = new Set<string>();
  segments.forEach((segment) => {
    segment.metadata?.tags?.forEach((tag) => {
      if (tag) {
        tagSet.add(tag);
      }
    });
  });

  if (tagSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      if (decision.choiceType) {
        tagSet.add(decision.choiceType);
      }
      decision.context.situation
        ?.split(/\s+/)
        .filter((word) => word.length > 4)
        .forEach((word) => tagSet.add(word.toLowerCase()));
    });
  }
  const activeTags = Array.from(tagSet).slice(0, 15);

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
    charactersPresent,
    situation,
    recentEvents,
    activeTags,
    worldId,
    sessionId,
    timestamp: contextTimestamp,
  };
}

function getDecisionContribution(
  score: DecisionRelevanceScore,
  weights: RelevanceScoringConfig['weights'],
  key: WeightKey
) {
  const scoreValue = score[SCORE_KEY_MAP[key]] ?? 0;
  const weight = weights[key];
  return {
    score: scoreValue,
    weight,
    contribution: scoreValue * weight,
  };
}

export const RelevanceDebuggerSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [decisions, setDecisions] = useState<PlayerDecision[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [scope, setScope] = useState<'session' | 'world' | 'all'>('session');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [topN, setTopN] = useState<number>(10);
  const [weightInputs, setWeightInputs] = useState<WeightInputs>({
    recency: 0.25,
    context: 0.3,
    impact: 0.2,
    tagMatch: 0.15,
    character: 0.1,
  });
  const [recencyDecayRate, setRecencyDecayRate] = useState(0.1);
  const [maxDaysRelevant, setMaxDaysRelevant] = useState(30);
  const [minRelevanceScore, setMinRelevanceScore] = useState(0.1);
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
    decisions.forEach((decision) => {
      uniqueSessions.add(decision.sessionId);
    });
    return Array.from(uniqueSessions).sort();
  }, [decisions]);

  const availableWorlds = useMemo(() => {
    const uniqueWorlds = new Set<string>();
    decisions.forEach((decision) => {
      uniqueWorlds.add(decision.worldId);
    });
    return Array.from(uniqueWorlds).sort();
  }, [decisions]);

  useEffect(() => {
    if (!isMounted) return;
    if (availableSessions.length === 0) {
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
    if (!isMounted) return;
    if (availableWorlds.length === 0) {
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

  const normalizedWeights = useMemo(() => normalizeWeights(weightInputs), [weightInputs]);

  const effectiveSessionId = selectedSessionId ?? activeSessionId ?? null;
  const currentWorldId =
    selectedWorldId ?? activeSessionWorldId ?? availableWorlds[0] ?? 'unknown-world';

  const filteredDecisions = useMemo(() => {
    if (scope === 'session') {
      if (!effectiveSessionId) return [];
      return decisions.filter((decision) => decision.sessionId === effectiveSessionId);
    }
    if (scope === 'world') {
      if (!selectedWorldId) return [];
      return decisions.filter((decision) => decision.worldId === selectedWorldId);
    }
    return decisions;
  }, [decisions, scope, effectiveSessionId, selectedWorldId]);

  const contextSessionId = effectiveSessionId ?? availableSessions[0] ?? null;

  const contextSegments = useMemo(() => {
    if (!contextSessionId) return [] as NarrativeSegment[];
    const ids = sessionSegments[contextSessionId] ?? [];
    return ids
      .map((segmentId) => segments[segmentId])
      .filter(Boolean) as NarrativeSegment[];
  }, [contextSessionId, sessionSegments, segments]);

  const contextDecisions = useMemo(() => {
    if (contextSessionId) {
      const sessionDecisions = decisions.filter(
        (decision) => decision.sessionId === contextSessionId
      );
      if (sessionDecisions.length > 0) {
        return sessionDecisions;
      }
    }
    if (selectedWorldId) {
      const worldDecisions = decisions.filter((decision) => decision.worldId === selectedWorldId);
      if (worldDecisions.length > 0) {
        return worldDecisions;
      }
    }
    return decisions;
  }, [contextSessionId, decisions, selectedWorldId]);

  const currentContext = useMemo<CurrentNarrativeContext | null>(() => {
    if (!contextSessionId) {
      if (contextDecisions.length === 0) {
        return null;
      }
      return buildRelevanceContext({
        sessionId: contextDecisions[0].sessionId ?? 'unknown-session',
        worldId: currentWorldId,
        segments: [],
        decisions: contextDecisions,
      });
    }

    return buildRelevanceContext({
      sessionId: contextSessionId,
      worldId: currentWorldId,
      segments: contextSegments,
      decisions: contextDecisions,
    });
  }, [contextSessionId, contextDecisions, contextSegments, currentWorldId]);

  const scoringConfig = useMemo<RelevanceScoringConfig>(() => ({
    weights: normalizedWeights,
    recencyDecayRate: Math.max(0.001, recencyDecayRate),
    maxDaysRelevant: Math.max(1, Math.round(maxDaysRelevant)),
    minRelevanceScore: Math.max(0, Math.min(1, minRelevanceScore)),
  }), [normalizedWeights, recencyDecayRate, maxDaysRelevant, minRelevanceScore]);

  const analysis = useMemo<DecisionRelevanceResult | null>(() => {
    if (!currentContext || filteredDecisions.length === 0) {
      return null;
    }
    const calculator = new DecisionRelevanceCalculator(scoringConfig);
    return calculator.analyzeDecisionRelevance(filteredDecisions, currentContext);
  }, [currentContext, filteredDecisions, scoringConfig]);

  const topDecisions = useMemo(() => {
    if (!analysis) return [];
    const limit = Math.max(1, Math.min(MAX_TOP_N, topN));
    return analysis.rankedDecisions.slice(0, limit);
  }, [analysis, topN]);

  useEffect(() => {
    if (!analysis || topDecisions.length === 0) {
      setSelectedDecisionId(null);
      return;
    }

    setSelectedDecisionId((prev) => {
      if (prev && analysis.rankedDecisions.some((item) => item.decision.id === prev)) {
        return prev;
      }
      return topDecisions[0].decision.id;
    });
  }, [analysis, topDecisions]);

  const selectedDecision = useMemo(() => {
    if (!analysis || !selectedDecisionId) return null;
    return analysis.rankedDecisions.find((item) => item.decision.id === selectedDecisionId) ?? null;
  }, [analysis, selectedDecisionId]);

  const breakdown = useMemo(() => {
    if (!selectedDecision) return [];
    const { score } = selectedDecision;
    return (Object.keys(WEIGHT_LABELS) as WeightKey[]).map((key) => ({
      key,
      label: WEIGHT_LABELS[key],
      ...getDecisionContribution(score, scoringConfig.weights, key),
    }));
  }, [selectedDecision, scoringConfig.weights]);

  const handleWeightChange = (key: WeightKey, value: string) => {
    const numeric = Number.parseFloat(value);
    const safeValue = Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0;
    setWeightInputs((prev) => ({
      ...prev,
      [key]: safeValue,
    }));
  };

  const handleTopNChange = (value: string) => {
    const numeric = Number.parseInt(value, 10);
    if (!Number.isNaN(numeric)) {
      setTopN(Math.max(1, Math.min(MAX_TOP_N, numeric)));
    }
  };

  const handleRefresh = () => {
    setRefreshVersion((prev) => prev + 1);
  };

  const renderWeightInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(Object.keys(WEIGHT_LABELS) as WeightKey[]).map((key) => (
        <div key={key} className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gray-900">
            {WEIGHT_LABELS[key]} Weight
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={weightInputs[key]}
              onChange={(event) => handleWeightChange(key, event.target.value)}
              className="text-xs"
              data-testid={`weight-input-${key}`}
            />
            <span className="text-xs text-gray-700">
              Normalized: {formatPercent(scoringConfig.weights[key])}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isMounted) {
    return (
      <DevToolsSection title="Decision Relevance Debugger">
        <div className="text-xs text-gray-700">Loading relevance debugger…</div>
      </DevToolsSection>
    );
  }

  const worldDisplayName = (worldId: string | null) => {
    if (!worldId) return 'All Worlds';
    const name = worlds[worldId]?.name;
    return name ? `${name} (${worldId})` : worldId;
  };

  return (
    <div data-testid="relevance-debugger-section" className="space-y-4">
      <DevToolsSection title="Configuration & Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-scope">
              Scope
            </label>
            <Select
              id="relevance-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as 'session' | 'world' | 'all')}
              className="text-xs"
            >
              <option value="session">Active Session</option>
              <option value="world">World</option>
              <option value="all">All Decisions</option>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-session">
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
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-world">
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
                  {worldDisplayName(worldId)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-topn">
              Top Decisions (max {MAX_TOP_N})
            </label>
            <Input
              id="relevance-topn"
              type="number"
              min={1}
              max={MAX_TOP_N}
              value={topN}
              onChange={(event) => handleTopNChange(event.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleRefresh}
          >
            Refresh Decisions
          </Button>
          <div className="text-xs text-gray-700">
            Viewing {filteredDecisions.length} decision
            {filteredDecisions.length === 1 ? '' : 's'} &middot; Context Session:{' '}
            {contextSessionId ?? 'unknown'} &middot; Context World: {worldDisplayName(currentWorldId)}
          </div>
        </div>
      </DevToolsSection>

      <DevToolsSection title="Scoring Controls">
        <div className="space-y-4">
          {renderWeightInputs()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-900" htmlFor="relevance-decay-rate">
                Recency Decay Rate (λ)
              </label>
              <Input
                id="relevance-decay-rate"
                type="number"
                min={0.001}
                step={0.01}
                value={recencyDecayRate}
                onChange={(event) => {
                  const numeric = Number.parseFloat(event.target.value);
                  setRecencyDecayRate(Number.isFinite(numeric) ? Math.max(0.001, numeric) : 0.001);
                }}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-900" htmlFor="relevance-max-days">
                Max Days Relevant
              </label>
              <Input
                id="relevance-max-days"
                type="number"
                min={1}
                value={maxDaysRelevant}
                onChange={(event) => {
                  const numeric = Number.parseInt(event.target.value, 10);
                  setMaxDaysRelevant(Number.isFinite(numeric) ? Math.max(1, numeric) : 1);
                }}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-900" htmlFor="relevance-min-score">
                Min Relevance Threshold
              </label>
              <Input
                id="relevance-min-score"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={minRelevanceScore}
                onChange={(event) => {
                  const numeric = Number.parseFloat(event.target.value);
                  setMinRelevanceScore(
                    Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0
                  );
                }}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </DevToolsSection>

      <DevToolsSection title="Score Summary">
        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-900">
            <div data-testid="relevance-summary-total">
              <div className="font-semibold text-sm">Total Decisions</div>
              <div>{analysis.totalDecisions}</div>
            </div>
            <div data-testid="relevance-summary-relevant">
              <div className="font-semibold text-sm">Above Threshold</div>
              <div>
                {analysis.relevantDecisions} decisions &middot; Threshold {formatScore(scoringConfig.minRelevanceScore)}
              </div>
            </div>
            <div data-testid="relevance-summary-average">
              <div className="font-semibold text-sm">Average Score</div>
              <div>{formatScore(analysis.averageScore)}</div>
            </div>
            <div>
              <div className="font-semibold text-sm">Processing Time</div>
              <div>{analysis.scoringMetadata.processingTimeMs.toFixed(2)} ms</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-700">
            {filteredDecisions.length === 0
              ? 'No decisions available for the selected scope yet.'
              : 'Waiting for context data to compute relevance scores.'}
          </div>
        )}
      </DevToolsSection>

      <DevToolsSection title="Decision Scores">
        {analysis && topDecisions.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full border border-gray-300 text-xs"
              data-testid="relevance-scores-table"
            >
              <thead className="bg-gray-200 text-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left">Decision</th>
                  <th className="px-3 py-2 text-right">Overall</th>
                  <th className="px-3 py-2 text-right">Recency</th>
                  <th className="px-3 py-2 text-right">Context</th>
                  <th className="px-3 py-2 text-right">Impact</th>
                  <th className="px-3 py-2 text-right">Tag</th>
                  <th className="px-3 py-2 text-right">Character</th>
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
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {formatScore(score.overallScore)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatScore(score.recencyScore)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatScore(score.contextScore)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatScore(score.impactScore)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatScore(score.tagMatchScore)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatScore(score.characterScore)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-gray-700">
            {filteredDecisions.length === 0
              ? 'No decisions match the selected scope.'
              : 'Relevance scores are not available yet. Adjust context or refresh data.'}
          </div>
        )}
      </DevToolsSection>

      {selectedDecision && (
        <DevToolsSection title="Decision Breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-900">
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Decision Prompt</div>
                <div>{selectedDecision.decision.prompt}</div>
              </div>
              <div>
                <div className="font-semibold">Choice</div>
                <div>{selectedDecision.decision.choiceText}</div>
              </div>
              <div>
                <div className="font-semibold">Scores & Contributions</div>
                <table className="w-full border border-gray-300 text-xs">
                  <thead className="bg-gray-200 text-gray-900">
                    <tr>
                      <th className="px-2 py-1 text-left">Factor</th>
                      <th className="px-2 py-1 text-right">Score</th>
                      <th className="px-2 py-1 text-right">Weight</th>
                      <th className="px-2 py-1 text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((item) => (
                      <tr key={item.key} className="border-t border-gray-200">
                        <td className="px-2 py-1">{item.label}</td>
                        <td className="px-2 py-1 text-right">{formatScore(item.score)}</td>
                        <td className="px-2 py-1 text-right">{formatPercent(item.weight)}</td>
                        <td className="px-2 py-1 text-right">{formatScore(item.contribution)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-900">
                <div>
                  <div className="font-semibold">Calculated At</div>
                  <div>{selectedDecision.score.calculatedAt}</div>
                </div>
                <div>
                  <div className="font-semibold">Days Since Decision</div>
                  <div>{selectedDecision.score.metadata?.daysSinceDecision ?? '—'}</div>
                </div>
                <div>
                  <div className="font-semibold">Impact Category</div>
                  <div>{selectedDecision.score.metadata?.impactCategory ?? '—'}</div>
                </div>
                <div>
                  <div className="font-semibold">Matched Tags</div>
                  <div>
                    {(selectedDecision.score.metadata?.matchedTags ?? []).join(', ') || '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Decision Context Snapshot</div>
                <JsonViewer data={selectedDecision.decision.context} className="bg-white" />
              </div>
              <div>
                <div className="font-semibold">Current Narrative Context</div>
                <JsonViewer data={currentContext ?? {}} className="bg-white" />
              </div>
            </div>
          </div>
        </DevToolsSection>
      )}
    </div>
  );
};
