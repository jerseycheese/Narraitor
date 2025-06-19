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
      {/* Background connector line */}
      <div 
        className="absolute top-5 h-1 bg-gray-200" 
        style={{ 
          left: `${50 / steps.length}%`,
          right: `${50 / steps.length}%`
        }} 
      />
      
      {/* Steps container */}
      <div className="relative flex justify-between items-start">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className="flex flex-col items-center flex-1"
            style={{ maxWidth: `${100 / steps.length}%` }}
          >
            {/* Active connector overlay */}
            {index > 0 && index <= currentStep && (
              <div
                className="absolute top-5 h-1 bg-blue-500"
                style={{
                  left: `${(100 / steps.length) * (index - 1) + (50 / steps.length)}%`,
                  width: `${100 / steps.length}%`,
                }}
              />
            )}
            
            <div
              className={cn(
                wizardStyles.progress.circle,
                "relative z-10",
                index === currentStep
                  ? wizardStyles.progress.circleActive
                  : index < currentStep
                  ? wizardStyles.progress.circleCompleted
                  : wizardStyles.progress.circleInactive
              )}
            >
              {index + 1}
            </div>
            <span className={cn(wizardStyles.progress.label, "text-center mt-2 px-1")}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
