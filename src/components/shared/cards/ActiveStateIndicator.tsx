import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface ActiveStateIndicatorProps {
  /** The text to display in the indicator */
  text?: string;
  /** Custom CSS classes to apply */
  className?: string;
  /** Icon to display before the text */
  icon?: React.ReactNode;
}

/**
 * ActiveStateIndicator - Displays a green header banner to indicate active state
 *
 * @example
 * <ActiveStateIndicator text="Currently Active World" />
 *
 * @example With custom icon
 * <ActiveStateIndicator
 *   text="Active Character"
 *   icon={<UserIcon />}
 * />
 */
export const ActiveStateIndicator: React.FC<ActiveStateIndicatorProps> = ({
  text = 'Currently Active',
  className = '',
  icon,
}) => {
  const defaultIcon = <CheckCircle aria-hidden="true" />;

  return (
    <div className={`active-state-indicator ${className}`}>
      <div>
        {icon || defaultIcon}
        <span>{text}</span>
      </div>
    </div>
  );
};

