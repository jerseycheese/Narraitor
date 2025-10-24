'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DevToolsSection } from '../shared/DevToolsSection';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { DecisionRelevanceCalculator } from '@/lib/ai/decisionRelevanceCalculator';
import { buildRelevanceContext } from '@/lib/ai/relevanceDebugger';
import type { CurrentNarrativeContext, DecisionRelevanceResult } from '@/types/relevance.types';
import type { PlayerDecision } from '@/types/personalization.types';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';
import { useShallow } from 'zustand/react/shallow';
import { FilterControls } from './FilterControls';
import { ScoresTable } from './ScoresTable';
import { DecisionDetails } from './DecisionDetails';

const DISPLAY_LIMIT = 12;

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
      <FilterControls
        scope={scope}
        onScopeChange={setScope}
        selectedSessionId={selectedSessionId}
        onSessionChange={setSelectedSessionId}
        availableSessions={availableSessions}
        selectedWorldId={selectedWorldId}
        onWorldChange={setSelectedWorldId}
        availableWorlds={availableWorlds}
        contextSessionId={contextSessionId}
        contextWorldId={contextWorldId}
        worldDisplayName={displayWorldName}
        filteredDecisionsCount={filteredDecisions.length}
        onRefresh={() => setRefreshVersion((prev) => prev + 1)}
      />

      <ScoresTable
        analysis={analysis}
        topDecisions={topDecisions}
        selectedDecisionId={selectedDecisionId}
        onSelectDecision={setSelectedDecisionId}
        filteredDecisionsCount={filteredDecisions.length}
      />

      <DecisionDetails selectedDecision={selectedDecision} currentContext={currentContext} />
    </div>
  );
};
