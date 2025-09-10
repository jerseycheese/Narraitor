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
    <div className={`relative mb-8 ${className}`}>
      {/* Steps and connectors */}
      <div className="relative flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div className="flex flex-col items-center flex-1">
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
              {/* Label */}
              <span className={cn(wizardStyles.progress.label, 'text-center mt-2 px-1')}>{step.label}</span>
            </div>
            {/* Connector (no connector after last circle) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 -mt-6">
                <div className={`h-full ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
