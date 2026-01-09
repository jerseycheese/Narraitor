// src/components/Narrative/ConsequenceBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EntityID } from '@/types/common.types';
import { cn } from '@/lib/utils';

interface ConsequenceBadgeProps {
  decisionId: EntityID;
  decisionText: string;
  distanceFromDecision: number;
  className?: string;
}

/**
 * Displays a badge indicating that a narrative segment resulted from a player decision
 * (Issue #971 - Show decision consequences in narrative UI)
 */
export const ConsequenceBadge: React.FC<ConsequenceBadgeProps> = ({
  decisionId,
  decisionText,
  distanceFromDecision,
  className,
}) => {
  // Immediate = 0-2 segments from decision, Longer-term = 3+
  // If distance is unknown (-1), default to longer-term (more conservative)
  const isImmediate = distanceFromDecision >= 0 && distanceFromDecision <= 2;
  const variant = isImmediate ? 'info-static' : 'secondary-static';
  const timingLabel = isImmediate ? 'Immediate' : 'Longer-term';
  const timingIcon = isImmediate ? '⚡' : '⏳';

  return (
    <Badge
      variant={variant}
      size="sm"
      className={cn('consequence-badge gap-1', className)}
      data-consequence={isImmediate ? 'immediate' : 'longer-term'}
      data-decision-id={decisionId}
    >
      <span aria-hidden="true">{timingIcon}</span>
      <span className="text-[10px] uppercase tracking-wide">{timingLabel}</span>
      <span className="sr-only">consequence:</span>
      <span>{decisionText}</span>
    </Badge>
  );
};
