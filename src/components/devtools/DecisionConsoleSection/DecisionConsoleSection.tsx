'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { JsonViewer } from '../JsonViewer';
import { DevToolsSection } from '../shared/DevToolsSection';
import { buildDecisionSnapshot } from '../shared/decisionSnapshot';
import type { PlayerDecision } from '@/types/personalization.types';
import './DecisionConsoleSection.css';

const ALL = 'all';

const formatTimestamp = (iso: string): string => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
};

const matchesSearch = (decision: PlayerDecision, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    decision.prompt.toLowerCase().includes(needle) ||
    decision.choiceText.toLowerCase().includes(needle)
  );
};

/**
 * DecisionConsoleSection (#212, epic #1302)
 *
 * Searchable, read-only console over the playerDecisionTracker records:
 * filter by text/choice type/world, inspect full metadata per record, view
 * the aggregate choice-pattern analysis, and export the filtered set as JSON.
 * Reads point-in-time snapshots (Refresh re-reads); never mutates tracker
 * or store state.
 */
export const DecisionConsoleSection = () => {
  const [snapshot, setSnapshot] = useState(() => buildDecisionSnapshot());
  const [searchText, setSearchText] = useState('');
  const [choiceTypeFilter, setChoiceTypeFilter] = useState(ALL);
  const [worldFilter, setWorldFilter] = useState(ALL);

  const { trackerDecisions, patterns } = snapshot;

  const choiceTypes = useMemo(
    () => [...new Set(trackerDecisions.map((decision) => decision.choiceType))].sort(),
    [trackerDecisions]
  );
  const worldIds = useMemo(
    () => [...new Set(trackerDecisions.map((decision) => decision.worldId))].sort(),
    [trackerDecisions]
  );

  const filteredDecisions = useMemo(
    () =>
      trackerDecisions.filter(
        (decision) =>
          matchesSearch(decision, searchText) &&
          (choiceTypeFilter === ALL || decision.choiceType === choiceTypeFilter) &&
          (worldFilter === ALL || decision.worldId === worldFilter)
      ),
    [trackerDecisions, searchText, choiceTypeFilter, worldFilter]
  );

  const handleRefresh = () => {
    setSnapshot(buildDecisionSnapshot());
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredDecisions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `narraitor-decisions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="devtools-decision-console" data-testid="devtools-decision-console-section">
      <div className="devtools-decision-console-controls">
        <Input
          type="search"
          placeholder="Search prompt or choice text"
          aria-label="Search decisions"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          data-testid="decision-console-search"
        />
        <Select
          aria-label="Filter by choice type"
          value={choiceTypeFilter}
          onChange={(event) => setChoiceTypeFilter(event.target.value)}
          data-testid="decision-console-choice-type-filter"
        >
          <option value={ALL}>All choice types</option>
          {choiceTypes.map((choiceType) => (
            <option key={choiceType} value={choiceType}>
              {choiceType}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by world"
          value={worldFilter}
          onChange={(event) => setWorldFilter(event.target.value)}
          data-testid="decision-console-world-filter"
        >
          <option value={ALL}>All worlds</option>
          {worldIds.map((worldId) => (
            <option key={worldId} value={worldId}>
              {worldId}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="sm" onClick={handleRefresh} data-testid="decision-console-refresh">
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={filteredDecisions.length === 0}
          data-testid="decision-console-export"
        >
          Export JSON
        </Button>
      </div>

      <DevToolsSection title="Choice patterns">
        {trackerDecisions.length === 0 ? (
          <p className="devtools-decision-console-empty">No decisions tracked yet.</p>
        ) : (
          <div className="devtools-decision-console-patterns" data-testid="decision-console-patterns">
            <div className="devtools-decision-console-pattern-badges">
              {patterns.dominantChoiceTypes.map((choiceType, index) => (
                <Badge
                  key={choiceType}
                  variant={index === 0 ? 'info-static' : 'outline-static'}
                  size="sm"
                >
                  {choiceType} ({patterns.choiceDistribution[choiceType]})
                </Badge>
              ))}
            </div>
            <span className="devtools-decision-console-pattern-strength">
              Pattern strength {Math.round(patterns.patternStrength)}%
            </span>
          </div>
        )}
      </DevToolsSection>

      <div className="devtools-decision-console-meta">
        Showing {filteredDecisions.length} of {trackerDecisions.length} tracked decisions
      </div>

      <div className="devtools-decision-console-list">
        {trackerDecisions.length === 0 ? (
          <p className="devtools-decision-console-empty">
            Play a session and make choices to populate the tracker, then hit Refresh.
          </p>
        ) : filteredDecisions.length === 0 ? (
          <p className="devtools-decision-console-empty">No decisions match the current filters.</p>
        ) : (
          filteredDecisions.map((decision) => (
            <div
              key={decision.id}
              className="devtools-decision-console-entry"
              data-testid={`decision-console-entry-${decision.id}`}
            >
              <div className="devtools-decision-console-entry-head">
                <Badge variant="outline-static" size="sm">
                  {decision.choiceType}
                </Badge>
                <span className="devtools-decision-console-entry-time">
                  {formatTimestamp(decision.timestamp)}
                </span>
              </div>
              <p className="devtools-decision-console-entry-prompt">{decision.prompt}</p>
              <p className="devtools-decision-console-entry-choice">→ {decision.choiceText}</p>
              <CollapsibleSection title="Metadata" initialCollapsed={true}>
                <JsonViewer data={decision} />
              </CollapsibleSection>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
