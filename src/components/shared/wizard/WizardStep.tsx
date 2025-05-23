import React from 'react';
import { wizardStyles } from './styles/wizardStyles';

interface WizardStepProps {
  children: React.ReactNode;
  error?: string | null;
  className?: string;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  children,
  error,
  className = '',
}) => {
  return (
    <div className={`${wizardStyles.step.content} ${className}`}>
      {error && (
        <div className={wizardStyles.errorContainer}>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {children}
    </div>
  );
};