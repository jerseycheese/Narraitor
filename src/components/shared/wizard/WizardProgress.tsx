import React from 'react';
import { wizardStyles, cssClasses } from './styles/wizardStyles';

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
    <div
      className={cssClasses(
        'component-wizard-progress',
        wizardStyles.progress.container,
        className
      )}
    >
      <div className="wizard-progress-row">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cssClasses(
                'wizard-progress-step-wrapper',
                wizardStyles.progress.step,
                index === currentStep && wizardStyles.progress.stepActive,
                index < currentStep && wizardStyles.progress.stepCompleted
              )}
            >
              <div
                className={cssClasses(
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
              <span className={wizardStyles.progress.label}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="wizard-progress-connector-wrapper">
                <div
                  className={cssClasses(
                    wizardStyles.progress.connector,
                    index < currentStep && wizardStyles.progress.connectorActive
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
