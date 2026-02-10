'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { buildDecisionHistory } from '@/lib/narrative/decisionHistory';
import { formatDateTime, formatRelativeTime, titleCase } from '@/lib/utils';
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
      <CollapsibleSection
        title="Choice History"
        initialCollapsed={initialCollapsed}
      >
        {resolvedEntries.length === 0 ? (
          <p>
            No recorded choices yet. Your decisions will appear here once you
            start choosing.
          </p>
        ) : (
          <div>
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
                <Card
                  key={entry.decision.id}
                  data-testid="choice-history-entry"
                >
                  <div>
                    <div>
                      <p>{choiceText}</p>
                    </div>
                    <div>
                      {decisionWeight && (
                        <Badge variant="outline" size="sm">
                          {titleCase(decisionWeight)} decision
                        </Badge>
                      )}
                      {decisionOutcome && (
                        <Badge variant="secondary-static" size="sm">
                          {outcomeLabels[decisionOutcome]}
                        </Badge>
                      )}
                      {hasDetails && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-expanded={isExpanded}
                          aria-controls={detailsId}
                          onClick={() => {
                            setExpandedEntries((previous) =>
                              buildExpandedSet(previous, entry.decision.id)
                            );
                          }}
                        >
                          {isExpanded ? 'Hide details' : 'Details'}
                        </Button>
                      )}
                    </div>
                  </div>
                  {(decisionTime || outcomeLocation) && (
                    <div>
                      {decisionTime && (
                        <span title={timeTitle}>When: {timeLabel}</span>
                      )}
                      {outcomeLocation && <span>Where: {outcomeLocation}</span>}
                    </div>
                  )}
                  {hasDetails && isExpanded && (
                    <p id={detailsId}>{decisionPrompt}</p>
                  )}
                  <p>{outcomeText}</p>
                </Card>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
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
