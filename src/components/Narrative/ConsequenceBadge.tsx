// src/components/Narrative/ConsequenceBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EntityID } from '@/types/common.types';

interface ConsequenceBadgeProps {
  decisionId: EntityID;
  decisionText: string;
  segmentIndex: number;
  className?: string;
}

/**
 * Displays a badge indicating that a narrative segment resulted from a player decision
 * (Issue #971 - Show decision consequences in narrative UI)
 */
export const ConsequenceBadge: React.FC<ConsequenceBadgeProps> = ({
  decisionText,
  segmentIndex,
  className,
}) => {
  // Immediate = 0-2 segments from decision, Longer-term = 3+
  const isImmediate = segmentIndex <= 2;
  const variant = isImmediate ? 'info-static' : 'secondary-static';
  const label = isImmediate ? 'Immediate consequence' : 'Consequence';

  return (
    <Badge
      variant={variant}
      size="sm"
      className={className}
      aria-label={label}
    >
      ⚡ {decisionText}
    </Badge>
  );
};
