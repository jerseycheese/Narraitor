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
      {/* Steps and connectors without inline styles */}
      <div className="relative flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
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
            {/* Connector (no connector after last circle) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2">
                <div className={`h-full ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Labels row */}
      <div className="mt-2 flex justify-between">
        {steps.map((step) => (
          <span key={step.id} className={cn(wizardStyles.progress.label, 'text-center mt-2 px-1 flex-1')}>{step.label}</span>
        ))}
      </div>
    </div>
  );
};
