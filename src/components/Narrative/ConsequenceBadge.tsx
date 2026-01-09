// src/components/Narrative/ConsequenceBadge.tsx

import React from 'react';
import { EntityID } from '@/types/common.types';
import { cn } from '@/lib/utils';

interface ConsequenceBadgeProps {
  decisionId: EntityID;
  decisionText: string;
  className?: string;
}

/**
 * Displays a badge indicating that a narrative segment resulted from a player decision
 * (Issue #971 - Show decision consequences in narrative UI)
 */
export const ConsequenceBadge: React.FC<ConsequenceBadgeProps> = ({
  decisionId,
  decisionText,
  className,
}) => {
  return (
    <div
      className={cn(
        'consequence-badge rounded-md border border-border bg-muted px-3 py-2 text-base text-muted-foreground',
        className
      )}
      data-decision-id={decisionId}
    >
      <span className="font-semibold">Consequence</span>
      <span className="sr-only">:</span>
      <span className="ml-2">{decisionText}</span>
    </div>
  );
};
