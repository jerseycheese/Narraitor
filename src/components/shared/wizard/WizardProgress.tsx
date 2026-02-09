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
    <div className={`${className}`}>
      {/* Steps and connectors */}
      <div >
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div >
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
              {/* Label */}
              <span className={cssClasses(wizardStyles.progress.label, '')}>{step.label}</span>
            </div>
            {/* Connector (no connector after last circle) */}
            {index < steps.length - 1 && (
              <div >
                <div />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
