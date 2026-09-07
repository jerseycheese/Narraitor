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
  ariaLabel?: string;
  'aria-label'?: string;
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
  ariaLabel,
  'aria-label': ariaLabelProp,
}) => {
  const resolvedAriaLabel = ariaLabelProp ?? ariaLabel;
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={resolvedAriaLabel}
      className={`component-toggle-button ${wizardStyles.toggle.button} ${
        isActive ? wizardStyles.toggle.active : wizardStyles.toggle.inactive
      } ${className}`.trim()}
    >
      {isActive ? activeLabel : inactiveLabel}
    </button>
  );
};
