'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { buildDecisionHistory } from '@/lib/narrative/decisionHistory';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type {
  DecisionHistoryEntry,
  DecisionOutcome,
} from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { EntityID } from '@/types/common.types';

interface ChoiceHistorySectionProps {
  sessionId: string;
  entries?: DecisionHistoryEntry[];
  initialCollapsed?: boolean;
}

const outcomeLabels: Record<DecisionOutcome, string> = {
  success: 'Success',
  failure: 'Failure',
  mixed: 'Mixed',
  'critical-success': 'Critical success',
  'critical-failure': 'Critical failure',
};

const resolveDate = (value?: Date | string): Date | null => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getChoiceText = (entry: DecisionHistoryEntry): string => {
  const decision = entry.decision;
  const selectedOption = decision.options.find(
    (option) => option.id === decision.selectedOptionId
  );
  return selectedOption?.text || decision.selectedOptionId || 'Unknown choice';
};

const buildExpandedSet = (previous: Set<EntityID>, decisionId: EntityID) => {
  const next = new Set(previous);
  if (next.has(decisionId)) {
    next.delete(decisionId);
  } else {
    next.add(decisionId);
  }
  return next;
};

const EMPTY_LIST: EntityID[] = [];

interface ChoiceHistoryContentProps {
  entries: DecisionHistoryEntry[];
  initialCollapsed: boolean;
}

const ChoiceHistoryContent: React.FC<ChoiceHistoryContentProps> = ({
  entries,
  initialCollapsed,
}) => {
  const resolvedEntries = entries;
  const [expandedEntries, setExpandedEntries] = React.useState<Set<EntityID>>(
    new Set()
  );

  return (
    <section
      data-testid="choice-history-section"
      data-tutorial="choice-history-section"
    >
      {resolvedEntries.length === 0 ? (
        <p className="font-system text-xs text-muted-foreground uppercase tracking-wider">
          No recorded choices yet. Your decisions will appear here once you
          start choosing.
        </p>
      ) : (
        <div className="space-y-4">
          {resolvedEntries.map((entry) => {
            const choiceText = getChoiceText(entry);
            const decisionPrompt = entry.decision.prompt.trim();
            const outcomeSegment = entry.outcomeSegment;
            const outcomeText =
              outcomeSegment?.content || 'Impact unknown yet.';
            const outcomeLocation = outcomeSegment?.metadata?.location;
            const decisionTime =
              resolveDate(entry.decision.selectedAt) ||
              resolveDate(outcomeSegment?.createdAt) ||
              resolveDate(outcomeSegment?.timestamp);
            const timeLabel = decisionTime
              ? formatRelativeTime(decisionTime)
              : 'Time unknown';
            const timeTitle = decisionTime
              ? formatDateTime(decisionTime)
              : undefined;
            const decisionOutcome = outcomeSegment?.metadata?.decisionOutcome;
            const decisionWeight = entry.decision.decisionWeight;
            const hasDetails = Boolean(decisionPrompt);
            const isExpanded = expandedEntries.has(entry.decision.id);
            const detailsId = `decision-details-${entry.decision.id}`;

            return (
              <article
                key={entry.decision.id}
                className="manuscript-choice-history-entry"
                data-testid="choice-history-entry"
              >
                <h4 className="manuscript-choice-history-choice">{choiceText}</h4>

                <div className="manuscript-choice-history-meta">
                  {decisionWeight && (
                    <span className="manuscript-choice-history-meta-item">
                      {decisionWeight} WEIGHT
                    </span>
                  )}
                  {decisionOutcome && (
                    <span className="manuscript-choice-history-meta-item">
                      {outcomeLabels[decisionOutcome]}
                    </span>
                  )}
                  {decisionTime && (
                    <span className="manuscript-choice-history-meta-item" title={timeTitle}>
                      {timeLabel}
                    </span>
                  )}
                  {outcomeLocation && (
                    <span className="manuscript-choice-history-meta-item">
                      {outcomeLocation}
                    </span>
                  )}
                  {hasDetails && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="font-system text-[10px] uppercase tracking-wider h-5 px-2 ml-auto"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      onClick={() => {
                        setExpandedEntries((previous) =>
                          buildExpandedSet(previous, entry.decision.id)
                        );
                      }}
                    >
                      {isExpanded ? 'HIDE DETAILS' : 'DETAILS'}
                    </Button>
                  )}
                </div>

                {hasDetails && isExpanded && (
                  <div id={detailsId} className="manuscript-choice-history-details">
                    {decisionPrompt}
                  </div>
                )}

                <div className="manuscript-choice-history-outcome">
                  {outcomeText}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

const ChoiceHistoryFromStore: React.FC<ChoiceHistorySectionProps> = ({
  sessionId,
  initialCollapsed = true,
}) => {
  const sessionDecisionIds = useNarrativeStore(
    (state) => state.sessionDecisions[sessionId] || EMPTY_LIST
  );
  const sessionSegmentIds = useNarrativeStore(
    (state) => state.sessionSegments[sessionId] || EMPTY_LIST
  );
  const decisionsById = useNarrativeStore((state) => state.decisions);
  const segmentsById = useNarrativeStore((state) => state.segments);

  const sessionDecisions = React.useMemo(
    () => sessionDecisionIds.map((id) => decisionsById[id]).filter(Boolean),
    [sessionDecisionIds, decisionsById]
  );
  const sessionSegments = React.useMemo(
    () => sessionSegmentIds.map((id) => segmentsById[id]).filter(Boolean),
    [sessionSegmentIds, segmentsById]
  );

  const resolvedEntries = React.useMemo(
    () =>
      buildDecisionHistory({
        decisions: sessionDecisions,
        segments: sessionSegments,
      }),
    [sessionDecisions, sessionSegments]
  );

  return (
    <ChoiceHistoryContent
      entries={resolvedEntries}
      initialCollapsed={initialCollapsed}
    />
  );
};

export const ChoiceHistorySection: React.FC<ChoiceHistorySectionProps> = ({
  sessionId,
  entries,
  initialCollapsed = true,
}) => {
  if (entries) {
    return (
      <ChoiceHistoryContent
        entries={entries}
        initialCollapsed={initialCollapsed}
      />
    );
  }

  return (
    <ChoiceHistoryFromStore
      sessionId={sessionId}
      initialCollapsed={initialCollapsed}
    />
  );
};
