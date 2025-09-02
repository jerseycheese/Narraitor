import React from 'react';
import { getBadgeStyles, BadgeVariant, BadgeState } from '@/lib/utils/badgeStyles';

export interface StatusBadgeProps {
  variant: BadgeVariant;
  state?: BadgeState;
  label: string;
  description?: string;
  className?: string;
  testId?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  state,
  label,
  description,
  className = '',
  testId = 'status-badge',
}) => {
  const badgeStyles = getBadgeStyles(variant, state);

  return (
    <div data-testid={testId} className={className}>
      <span className={badgeStyles}>
        {label}
      </span>
      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatusBadge;