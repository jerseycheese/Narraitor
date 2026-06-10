'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { JsonViewer } from '../JsonViewer';
import { normalizeForTrackerMatch } from '../shared/decisionSnapshot';
import type { DecisionInspectorSnapshot } from '../shared/decisionSnapshot';
import type { Decision, NarrativeSegment, DecisionWeight } from '@/types/narrative.types';
import type { PlayerDecision } from '@/types/personalization.types';

const WEIGHT_BADGE_VARIANTS: Record<DecisionWeight, 'outline-static' | 'warning-static' | 'destructive-static'> = {
  minor: 'outline-static',
  major: 'warning-static',
  critical: 'destructive-static',
};

const excerpt = (text: string, maxLength: number = 160): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

const formatDate = (value: Date | string | undefined): string => {
  if (!value) return 'not selected yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

/**
 * Finds the tracker record for a decision: same session, and the sanitized
 * prompt + selected-option text both match what the tracker persisted. The
 * store records `decision.prompt` (sanitized to 500) and `selectedOption.text`
 * (sanitized to 300), so matching on both disambiguates same-session decisions
 * that happen to share a choice text but differ in prompt — without the prompt
 * discriminator, `find` would return the newest record (tracker stores
 * newest-first) for every such decision.
 */
const findTrackerRecord = (
  decision: Decision,
  sessionId: string,
  trackerDecisions: PlayerDecision[]
): PlayerDecision | undefined => {
  const selectedOption = decision.options.find(
    (option) => option.id === decision.selectedOptionId
  );
  if (!selectedOption) return undefined;

  const selectedText = normalizeForTrackerMatch(
    selectedOption.customText || selectedOption.text,
    300
  );
  const selectedPrompt = normalizeForTrackerMatch(decision.prompt, 500);
  return trackerDecisions.find(
    (record) =>
      record.sessionId === sessionId &&
      record.choiceText === selectedText &&
      normalizeForTrackerMatch(record.prompt, 500) === selectedPrompt
  );
};

const SegmentExcerpt = ({ label, segment }: { label: string; segment: NarrativeSegment }) => (
  <div className="devtools-decision-flow-segment">
    <span className="devtools-decision-flow-step-label">{label}</span>
    <Badge variant="outline-static" size="sm">
      {segment.type}
    </Badge>
    {segment.metadata.decisionOutcome && (
      <Badge variant="info-static" size="sm">
        {segment.metadata.decisionOutcome}
      </Badge>
    )}
    <p className="devtools-decision-flow-segment-content">{excerpt(segment.content)}</p>
  </div>
);

const PromptDebugBlock = ({ segment }: { segment: NarrativeSegment }) => {
  const debugInfo = segment.metadata.debugInfo;
  if (!debugInfo) {
    return (
      <p className="devtools-decision-flow-empty">
        No prompt debug info on this segment. Enable &quot;Show Prompts&quot; in the DevTools
        header before generating to capture it.
      </p>
    );
  }

  return (
    <div className="devtools-decision-flow-debug" data-testid="decision-flow-debug-info">
      <div className="devtools-decision-flow-debug-meta">
        <Badge variant="outline-static" size="sm">
          {debugInfo.templateName}
        </Badge>
        <span>{debugInfo.modelUsed}</span>
        {debugInfo.tokenUsage && (
          <span>
            {debugInfo.tokenUsage.promptTokens} prompt / {debugInfo.tokenUsage.completionTokens}{' '}
            completion tokens
          </span>
        )}
      </div>
      <CollapsibleSection title="Full prompt" initialCollapsed={true}>
        <pre className="devtools-decision-flow-prompt">{debugInfo.fullPrompt}</pre>
      </CollapsibleSection>
      <CollapsibleSection title="Prompt context detail" initialCollapsed={true}>
        <JsonViewer data={debugInfo} />
      </CollapsibleSection>
    </div>
  );
};

/**
 * One decision's creation trace: origin segment, generated options, the
 * player's selection, the tracker record it produced, the narrative outcome
 * segment(s), and prompt debug info when capture was on. Pure presentation
 * over a read-only snapshot.
 */
export const DecisionTrace = ({
  decision,
  sessionId,
  snapshot,
}: {
  decision: Decision;
  sessionId: string;
  snapshot: DecisionInspectorSnapshot;
}) => {
  const originSegment = decision.narrativeSegmentId
    ? snapshot.segments[decision.narrativeSegmentId]
    : undefined;
  const outcomeSegments = Object.values(snapshot.segments).filter(
    (segment) => segment.metadata.causedByDecisionId === decision.id
  );
  const trackerRecord = findTrackerRecord(decision, sessionId, snapshot.trackerDecisions);
  const debugSegment =
    outcomeSegments.find((segment) => segment.metadata.debugInfo) ||
    (originSegment?.metadata.debugInfo ? originSegment : undefined);

  return (
    <div className="devtools-decision-flow-trace" data-testid={`decision-flow-trace-${decision.id}`}>
      <div className="devtools-decision-flow-trace-head">
        {decision.decisionWeight && (
          <Badge variant={WEIGHT_BADGE_VARIANTS[decision.decisionWeight]} size="sm">
            {decision.decisionWeight}
          </Badge>
        )}
        <span className="devtools-decision-flow-trace-time">{formatDate(decision.selectedAt)}</span>
      </div>

      {originSegment && <SegmentExcerpt label="Presented after" segment={originSegment} />}

      <div className="devtools-decision-flow-step">
        <span className="devtools-decision-flow-step-label">Decision prompt</span>
        <p className="devtools-decision-flow-prompt-text">{decision.prompt}</p>
      </div>

      <div className="devtools-decision-flow-step">
        <span className="devtools-decision-flow-step-label">Generated options</span>
        <ul className="devtools-decision-flow-options">
          {decision.options.map((option) => {
            const isSelected = option.id === decision.selectedOptionId;
            return (
              <li
                key={option.id}
                className={clsx('devtools-decision-flow-option', isSelected && 'is-selected')}
                data-testid={`decision-flow-option-${option.id}`}
                data-selected={isSelected || undefined}
              >
                <span className="devtools-decision-flow-option-text">
                  {option.isCustomInput ? option.customText || option.text : option.text}
                </span>
                {option.alignment && (
                  <Badge variant="outline-static" size="sm">
                    {option.alignment}
                  </Badge>
                )}
                {option.isCustomInput && (
                  <Badge variant="secondary-static" size="sm">
                    custom input
                  </Badge>
                )}
                {isSelected && (
                  <Badge variant="success-static" size="sm">
                    selected
                  </Badge>
                )}
                {option.hint && (
                  <span className="devtools-decision-flow-option-hint">{option.hint}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="devtools-decision-flow-step">
        <span className="devtools-decision-flow-step-label">Recorded in tracker</span>
        {trackerRecord ? (
          <div className="devtools-decision-flow-tracker" data-testid="decision-flow-tracker-record">
            <Badge variant="info-static" size="sm">
              {trackerRecord.choiceType}
            </Badge>
            <span>{formatDate(trackerRecord.timestamp)}</span>
            <CollapsibleSection title="Tracker record" initialCollapsed={true}>
              <JsonViewer data={trackerRecord} />
            </CollapsibleSection>
          </div>
        ) : (
          <p className="devtools-decision-flow-empty">
            {decision.selectedOptionId
              ? 'No matching tracker record found for this selection.'
              : 'Awaiting player selection — nothing recorded yet.'}
          </p>
        )}
      </div>

      {outcomeSegments.map((segment) => (
        <SegmentExcerpt key={segment.id} label="Narrative outcome" segment={segment} />
      ))}

      <div className="devtools-decision-flow-step">
        <span className="devtools-decision-flow-step-label">Prompt debug info</span>
        {debugSegment ? (
          <PromptDebugBlock segment={debugSegment} />
        ) : (
          <p className="devtools-decision-flow-empty">
            No prompt debug info captured for this decision&apos;s segments. Enable &quot;Show
            Prompts&quot; in the DevTools header before generating to capture it.
          </p>
        )}
      </div>

      <CollapsibleSection title="Raw decision object" initialCollapsed={true}>
        <JsonViewer data={decision} />
      </CollapsibleSection>
    </div>
  );
};
