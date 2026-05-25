import React from 'react';
import { wizardStyles } from '../styles/wizardStyles';

export interface ToggleButtonProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onClick: () => void;
  testId?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  isActive,
  activeLabel = 'Selected',
  inactiveLabel = 'Excluded',
  onClick,
  testId,
  className = '',
  disabled = false,
  title,
}) => {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${wizardStyles.toggle.button} ${
        isActive ? wizardStyles.toggle.active : wizardStyles.toggle.inactive
      } ${className}`}
    >
      {isActive ? activeLabel : inactiveLabel}
    </button>
  );
};
