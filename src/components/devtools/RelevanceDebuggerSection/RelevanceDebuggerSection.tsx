'use client';

<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
import { DevToolsSection } from '../shared/DevToolsSection';
import { JsonViewer } from '../JsonViewer';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { DecisionRelevanceCalculator } from '@/lib/ai/decisionRelevanceCalculator';
<<<<<<< HEAD
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
=======
import type { CurrentNarrativeContext, DecisionRelevanceResult } from '@/types/relevance.types';
import type { PlayerDecision } from '@/types/personalization.types';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
import { getTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils/classNames';
import { useShallow } from 'zustand/react/shallow';

<<<<<<< HEAD
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
=======
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
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

interface ContextParams {
  sessionId: string;
  worldId: string;
  segments: NarrativeSegment[];
  decisions: PlayerDecision[];
}

function formatScore(value: number): string {
<<<<<<< HEAD
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
=======
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return '—';
  return values.join(', ');
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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
<<<<<<< HEAD
  const charactersPresent = Array.from(characterSet).slice(0, 10);
=======
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

  const situation =
    sortedDecisions.find((decision) => Boolean(decision.context.situation))?.context.situation;

  const recentEvents = segments
    .slice(-5)
    .map((segment) => segment.content?.substring(0, 120))
    .filter(Boolean);

  const tagSet = new Set<string>();
  segments.forEach((segment) => {
    segment.metadata?.tags?.forEach((tag) => {
<<<<<<< HEAD
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
=======
      if (tag) tagSet.add(tag);
    });
  });
  if (tagSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      if (decision.choiceType) tagSet.add(decision.choiceType);
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
      decision.context.situation
        ?.split(/\s+/)
        .filter((word) => word.length > 4)
        .forEach((word) => tagSet.add(word.toLowerCase()));
    });
  }
<<<<<<< HEAD
  const activeTags = Array.from(tagSet).slice(0, 15);
=======
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

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
<<<<<<< HEAD
    charactersPresent,
    situation,
    recentEvents,
    activeTags,
=======
    charactersPresent: Array.from(characterSet).slice(0, 10),
    situation,
    recentEvents,
    activeTags: Array.from(tagSet).slice(0, 15),
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
    worldId,
    sessionId,
    timestamp: contextTimestamp,
  };
}

<<<<<<< HEAD
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

=======
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
export const RelevanceDebuggerSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [decisions, setDecisions] = useState<PlayerDecision[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [scope, setScope] = useState<'session' | 'world' | 'all'>('session');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
<<<<<<< HEAD
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
=======
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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
<<<<<<< HEAD
    decisions.forEach((decision) => {
      uniqueSessions.add(decision.sessionId);
    });
=======
    decisions.forEach((decision) => uniqueSessions.add(decision.sessionId));
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
    return Array.from(uniqueSessions).sort();
  }, [decisions]);

  const availableWorlds = useMemo(() => {
    const uniqueWorlds = new Set<string>();
<<<<<<< HEAD
    decisions.forEach((decision) => {
      uniqueWorlds.add(decision.worldId);
    });
=======
    decisions.forEach((decision) => uniqueWorlds.add(decision.worldId));
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
    return Array.from(uniqueWorlds).sort();
  }, [decisions]);

  useEffect(() => {
<<<<<<< HEAD
    if (!isMounted) return;
    if (availableSessions.length === 0) {
=======
    if (!isMounted || availableSessions.length === 0) {
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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
<<<<<<< HEAD
    if (!isMounted) return;
    if (availableWorlds.length === 0) {
=======
    if (!isMounted || availableWorlds.length === 0) {
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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

<<<<<<< HEAD
  const normalizedWeights = useMemo(() => normalizeWeights(weightInputs), [weightInputs]);

  const effectiveSessionId = selectedSessionId ?? activeSessionId ?? null;
  const currentWorldId =
    selectedWorldId ?? activeSessionWorldId ?? availableWorlds[0] ?? 'unknown-world';

  const filteredDecisions = useMemo(() => {
    if (scope === 'session') {
      if (!effectiveSessionId) return [];
      return decisions.filter((decision) => decision.sessionId === effectiveSessionId);
=======
  const filteredDecisions = useMemo(() => {
    if (scope === 'session') {
      if (!selectedSessionId) return [];
      return decisions.filter((decision) => decision.sessionId === selectedSessionId);
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
    }
    if (scope === 'world') {
      if (!selectedWorldId) return [];
      return decisions.filter((decision) => decision.worldId === selectedWorldId);
    }
    return decisions;
<<<<<<< HEAD
  }, [decisions, scope, effectiveSessionId, selectedWorldId]);

  const contextSessionId = effectiveSessionId ?? availableSessions[0] ?? null;

  const contextSegments = useMemo(() => {
    if (!contextSessionId) return [] as NarrativeSegment[];
=======
  }, [decisions, scope, selectedSessionId, selectedWorldId]);

  const fallbackDecision = filteredDecisions[0] ?? decisions[0];
  const contextSessionId = selectedSessionId ?? fallbackDecision?.sessionId ?? 'unknown-session';
  const contextWorldId =
    selectedWorldId ?? fallbackDecision?.worldId ?? activeSessionWorldId ?? 'unknown-world';

  const contextSegments = useMemo(() => {
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
    const ids = sessionSegments[contextSessionId] ?? [];
    return ids
      .map((segmentId) => segments[segmentId])
      .filter(Boolean) as NarrativeSegment[];
  }, [contextSessionId, sessionSegments, segments]);

<<<<<<< HEAD
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
=======
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
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

  const analysis = useMemo<DecisionRelevanceResult | null>(() => {
    if (!currentContext || filteredDecisions.length === 0) {
      return null;
    }
<<<<<<< HEAD
    const calculator = new DecisionRelevanceCalculator(scoringConfig);
    return calculator.analyzeDecisionRelevance(filteredDecisions, currentContext);
  }, [currentContext, filteredDecisions, scoringConfig]);

  const topDecisions = useMemo(() => {
    if (!analysis) return [];
    const limit = Math.max(1, Math.min(MAX_TOP_N, topN));
    return analysis.rankedDecisions.slice(0, limit);
  }, [analysis, topN]);
=======
    return calculator.analyzeDecisionRelevance(filteredDecisions, currentContext);
  }, [calculator, currentContext, filteredDecisions]);

  const topDecisions = useMemo(() => {
    if (!analysis) return [];
    return analysis.rankedDecisions.slice(0, DISPLAY_LIMIT);
  }, [analysis]);
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

  useEffect(() => {
    if (!analysis || topDecisions.length === 0) {
      setSelectedDecisionId(null);
      return;
    }
<<<<<<< HEAD

    setSelectedDecisionId((prev) => {
      if (prev && analysis.rankedDecisions.some((item) => item.decision.id === prev)) {
=======
    setSelectedDecisionId((prev) => {
      if (prev && topDecisions.some((entry) => entry.decision.id === prev)) {
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
        return prev;
      }
      return topDecisions[0].decision.id;
    });
  }, [analysis, topDecisions]);

  const selectedDecision = useMemo(() => {
<<<<<<< HEAD
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
=======
    if (!selectedDecisionId) return null;
    return topDecisions.find((entry) => entry.decision.id === selectedDecisionId) ?? null;
  }, [selectedDecisionId, topDecisions]);
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)

  if (!isMounted) {
    return (
      <DevToolsSection title="Decision Relevance Debugger">
<<<<<<< HEAD
        <div className="text-xs text-gray-700">Loading relevance debugger…</div>
=======
        <div className="text-xs text-gray-700">Loading relevance data…</div>
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
      </DevToolsSection>
    );
  }

<<<<<<< HEAD
  const worldDisplayName = (worldId: string | null) => {
    if (!worldId) return 'All Worlds';
    const name = worlds[worldId]?.name;
    return name ? `${name} (${worldId})` : worldId;
=======
  const displayWorldName = (worldId: string | null) => {
    if (!worldId) return 'All worlds';
    const world = worlds[worldId];
    return world ? `${world.name} (${worldId})` : worldId;
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
  };

  return (
    <div data-testid="relevance-debugger-section" className="space-y-4">
<<<<<<< HEAD
      <DevToolsSection title="Configuration & Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-scope">
=======
      <DevToolsSection title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-900">
          <div className="flex flex-col space-y-1">
            <label className="font-medium" htmlFor="relevance-scope">
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
              Scope
            </label>
            <Select
              id="relevance-scope"
              value={scope}
<<<<<<< HEAD
              onChange={(event) => setScope(event.target.value as 'session' | 'world' | 'all')}
              className="text-xs"
            >
              <option value="session">Active Session</option>
              <option value="world">World</option>
              <option value="all">All Decisions</option>
=======
              onChange={(event) => setScope(event.target.value as typeof scope)}
              className="text-xs"
            >
              <option value="session">Active session</option>
              <option value="world">World</option>
              <option value="all">All decisions</option>
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
<<<<<<< HEAD
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-session">
=======
            <label className="font-medium" htmlFor="relevance-session">
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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
<<<<<<< HEAD
            <label className="text-xs font-medium text-gray-900" htmlFor="relevance-world">
=======
            <label className="font-medium" htmlFor="relevance-world">
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
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
<<<<<<< HEAD
                  {worldDisplayName(worldId)}
=======
                  {displayWorldName(worldId)}
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
<<<<<<< HEAD
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
=======
            <span className="font-medium">Context overview</span>
            <div className="text-gray-700">
              Session: {contextSessionId}
              <br />
              World: {displayWorldName(contextWorldId)}
            </div>
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
<<<<<<< HEAD
            onClick={handleRefresh}
          >
            Refresh Decisions
          </Button>
          <div className="text-xs text-gray-700">
            Viewing {filteredDecisions.length} decision
            {filteredDecisions.length === 1 ? '' : 's'} &middot; Context Session:{' '}
            {contextSessionId ?? 'unknown'} &middot; Context World: {worldDisplayName(currentWorldId)}
=======
            onClick={() => setRefreshVersion((prev) => prev + 1)}
          >
            Refresh decisions
          </Button>
          <div className="text-xs text-gray-700">
            Showing {filteredDecisions.length} decision
            {filteredDecisions.length === 1 ? '' : 's'} in scope
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
          </div>
        </div>
      </DevToolsSection>

<<<<<<< HEAD
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
=======
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
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
        ) : (
          <div className="text-xs text-gray-700">
            {filteredDecisions.length === 0
              ? 'No decisions available for the selected scope yet.'
<<<<<<< HEAD
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
=======
              : 'Waiting for context data. Refresh once the session has narrative segments.'}
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
          </div>
        )}
      </DevToolsSection>

      {selectedDecision && (
<<<<<<< HEAD
        <DevToolsSection title="Decision Breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-900">
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Decision Prompt</div>
=======
        <DevToolsSection title="Selected Decision Details">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-900"
            data-testid="relevance-details"
          >
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Prompt</div>
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
                <div>{selectedDecision.decision.prompt}</div>
              </div>
              <div>
                <div className="font-semibold">Choice</div>
                <div>{selectedDecision.decision.choiceText}</div>
              </div>
<<<<<<< HEAD
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
=======
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
>>>>>>> 0b8c8c83 (Expose decision relevance debugger in DevTools)
                <JsonViewer data={currentContext ?? {}} className="bg-white" />
              </div>
            </div>
          </div>
        </DevToolsSection>
      )}
    </div>
  );
};
