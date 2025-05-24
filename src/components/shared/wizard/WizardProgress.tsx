import React from 'react';
import { wizardStyles, cn } from './styles/wizardStyles';

interface WizardStep {
  id: string;
  label: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`${wizardStyles.progress.container} ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {index > 0 && (
            <div
              className={cn(
                wizardStyles.progress.connector,
                index <= currentStep ? wizardStyles.progress.connectorActive : ''
              )}
            />
          )}
          <div className={wizardStyles.progress.step}>
            <div
              className={cn(
                wizardStyles.progress.circle,
                index === currentStep
                  ? wizardStyles.progress.circleActive
                  : index < currentStep
                  ? wizardStyles.progress.circleCompleted
                  : wizardStyles.progress.circleInactive
              )}
            >
              {index + 1}
            </div>
            <span className={wizardStyles.progress.label}>
              {step.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};