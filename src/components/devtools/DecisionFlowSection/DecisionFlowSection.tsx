'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { buildDecisionSnapshot } from '../shared/decisionSnapshot';
import { DecisionTrace } from './DecisionTrace';
import type { Decision } from '@/types/narrative.types';
import './DecisionFlowSection.css';

/**
 * DecisionFlowSection (#213, epic #1302)
 *
 * Read-only trace of how each decision was created, presented, selected, and
 * recorded: origin segment → AI-generated options (alignment/custom-input) →
 * player selection → playerDecisionTracker record → outcome segment, plus the
 * segment-level prompt debug info when "Show Prompts" capture was on. Choice
 * generation prompts themselves aren't retained by the pipeline, so the trace
 * covers what state actually stores. Snapshots on demand; never mutates.
 */
export const DecisionFlowSection = () => {
  const [snapshot, setSnapshot] = useState(() => buildDecisionSnapshot());
  const sessionIds = useMemo(
    () =>
      Object.keys(snapshot.sessionDecisions).filter(
        (sessionId) => (snapshot.sessionDecisions[sessionId] || []).length > 0
      ),
    [snapshot.sessionDecisions]
  );
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => sessionIds[sessionIds.length - 1] || ''
  );

  const activeSessionId = sessionIds.includes(selectedSessionId)
    ? selectedSessionId
    : sessionIds[sessionIds.length - 1] || '';

  const decisions = useMemo(() => {
    const decisionIds = snapshot.sessionDecisions[activeSessionId] || [];
    return decisionIds
      .map((decisionId) => snapshot.storeDecisions[decisionId])
      .filter((decision): decision is Decision => Boolean(decision))
      .reverse();
  }, [snapshot, activeSessionId]);

  const handleRefresh = () => {
    setSnapshot(buildDecisionSnapshot());
  };

  return (
    <div className="devtools-decision-flow" data-testid="devtools-decision-flow-section">
      <div className="devtools-decision-flow-controls">
        <Select
          aria-label="Select session"
          value={activeSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
          data-testid="decision-flow-session-select"
        >
          {sessionIds.length === 0 ? (
            <option value="">No sessions with decisions</option>
          ) : (
            sessionIds.map((sessionId) => (
              <option key={sessionId} value={sessionId}>
                {sessionId} ({(snapshot.sessionDecisions[sessionId] || []).length})
              </option>
            ))
          )}
        </Select>
        <Button variant="ghost" size="sm" onClick={handleRefresh} data-testid="decision-flow-refresh">
          Refresh
        </Button>
      </div>

      {decisions.length === 0 ? (
        <p className="devtools-decision-flow-empty">
          No decisions in the narrative store yet. Play a session to a choice point, then hit
          Refresh.
        </p>
      ) : (
        <div className="devtools-decision-flow-traces">
          {decisions.map((decision) => (
            <DecisionTrace
              key={decision.id}
              decision={decision}
              sessionId={activeSessionId}
              snapshot={snapshot}
            />
          ))}
        </div>
      )}
    </div>
  );
};
