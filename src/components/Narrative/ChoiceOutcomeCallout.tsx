// src/components/Narrative/ChoiceOutcomeCallout.tsx

import React from 'react';
import { EntityID } from '@/types/common.types';
import { cn } from '@/lib/utils';
import { DecisionOutcome } from '@/types/narrative.types';

interface ChoiceOutcomeCalloutProps {
  decisionId: EntityID;
  decisionText: string;
  decisionOutcome?: DecisionOutcome;
  decisionOutcomeSummary?: string;
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

const outcomeClasses: Record<DecisionOutcome, string> = {
  success: 'text-success',
  failure: 'text-destructive',
  mixed: 'text-warning',
  'critical-success': 'text-success',
  'critical-failure': 'text-destructive',
};

export const ChoiceOutcomeCallout: React.FC<ChoiceOutcomeCalloutProps> = ({
  decisionId,
  decisionText,
  decisionOutcome,
  decisionOutcomeSummary,
  className,
}) => {
  return (
    <div
      className={cn(
        'choice-outcome-callout rounded-md border border-border bg-muted px-3 py-2 text-base text-muted-foreground',
        className
      )}
      data-decision-id={decisionId}
    >
      <span>{decisionText}</span>
      {decisionOutcome && (
        <div className={cn('mt-1 text-sm', outcomeClasses[decisionOutcome])}>
          {outcomeLabels[decisionOutcome]}
          {decisionOutcomeSummary ? ` (${decisionOutcomeSummary})` : ''}
        </div>
      )}
    </div>
  );
};
