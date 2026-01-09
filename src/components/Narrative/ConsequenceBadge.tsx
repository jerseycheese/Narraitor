// src/components/Narrative/ConsequenceBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EntityID } from '@/types/common.types';
import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';

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
    <Badge
      variant="secondary-static"
      size="sm"
      className={cn('consequence-badge gap-1', className)}
      data-decision-id={decisionId}
    >
      <Link2
        className="h-3 w-3"
        aria-hidden="true"
        data-testid="consequence-icon"
      />
      <span className="text-[10px] uppercase tracking-wide">Consequence</span>
      <span className="sr-only">consequence:</span>
      <span>{decisionText}</span>
    </Badge>
  );
};
