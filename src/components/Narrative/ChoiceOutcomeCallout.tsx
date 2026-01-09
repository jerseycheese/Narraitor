// src/components/Narrative/ChoiceOutcomeCallout.tsx

import React from 'react';
import { EntityID } from '@/types/common.types';
import { cn } from '@/lib/utils';
import { DecisionOutcome } from '@/types/narrative.types';

interface ChoiceOutcomeCalloutProps {
  decisionId: EntityID;
  decisionText: string;
  decisionOutcome?: DecisionOutcome;
  className?: string;
}

/**
 * Displays a badge indicating that a narrative segment resulted from a player decision
 * (Issue #971 - Show decision consequences in narrative UI)
 */
const outcomeLabels: Record<DecisionOutcome, string> = {
  success: 'Success',
  failure: 'Failure',
  mixed: 'Mixed',
  'critical-success': 'Critical success',
  'critical-failure': 'Critical failure',
};

const outcomeAccentClasses: Record<DecisionOutcome, string> = {
  success: 'bg-success',
  failure: 'bg-destructive',
  mixed: 'bg-warning',
  'critical-success': 'bg-success',
  'critical-failure': 'bg-destructive',
};

const buildOutcomeDecisionText = (
  decisionText: string,
  decisionOutcome?: DecisionOutcome
) => {
  if (!decisionOutcome) return decisionText;
  if (decisionOutcome === 'success' || decisionOutcome === 'critical-success') {
    return decisionText;
  }

  const trimmed = decisionText.trim();
  if (!trimmed) return decisionText;
  if (/^you\s+attempt\s+to\s+/i.test(trimmed)) {
    return trimmed;
  }
  if (/^you\s+choose\s+to\s+/i.test(trimmed)) {
    return trimmed.replace(/^you\s+choose\s+to\s+/i, 'You attempt to ');
  }
  if (/^you\s+/i.test(trimmed)) {
    return trimmed.replace(/^you\s+/i, 'You attempt to ');
  }

  const firstChar = trimmed.charAt(0);
  const normalized =
    firstChar && /[A-Z]/.test(firstChar)
      ? `${firstChar.toLowerCase()}${trimmed.slice(1)}`
      : trimmed;

  return `You attempt to ${normalized}`;
};

export const ChoiceOutcomeCallout: React.FC<ChoiceOutcomeCalloutProps> = ({
  decisionId,
  decisionText,
  decisionOutcome,
  className,
}) => {
  const displayDecisionText = buildOutcomeDecisionText(
    decisionText,
    decisionOutcome
  );

  return (
    <div
      className={cn(
        'choice-outcome-callout rounded-md border border-border bg-muted px-3 py-2 text-base text-muted-foreground',
        className
      )}
      data-decision-id={decisionId}
    >
      <span>{displayDecisionText}</span>
      {decisionOutcome && (
        <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
          <span
            className={cn('h-2 w-2 rounded-full', outcomeAccentClasses[decisionOutcome])}
            aria-hidden="true"
          />
          <span className="font-medium">{outcomeLabels[decisionOutcome]}</span>
        </div>
      )}
    </div>
  );
};
